/* ============================================================
   U-Ride — src/services/reporte.service.js
   RF10  Reportar a otro estudiante (motivo + evidencia)
   RF11  Administración: revisar reportes, advertir, suspender
   ============================================================ */

const { Op } = require("sequelize");

let _m = null;
const M = () => {
  if (!_m) _m = require("../models");
  return _m;
};

const apiError = (msg, status = 400) => {
  const e = new Error(msg);
  e.status = status;
  return e;
};

/* ────────────────────────────────────────────────────────────
   RF10 — Crear reporte
   ─────────────────────────────────────────────────────────── */
exports.crearReporte = async (
  reportanteId,
  { reportadoId, viajeId, motivo, evidencia },
) => {
  const { Reporte, Usuario, Viaje, Participacion, Conductor, Pasajero } = M();

  if (reportanteId === reportadoId)
    throw apiError("No puedes reportarte a ti mismo.", 400);

  if (!motivo?.trim() || motivo.trim().length < 10)
    throw apiError("El motivo debe tener al menos 10 caracteres.", 400);

  // Verificar que el viaje existe y que el reportante participó
  const viaje = await Viaje.findByPk(viajeId);
  if (!viaje) throw apiError("Viaje no encontrado.", 404);

  // Verificar que el reportado también participó en ese viaje
  const conductorReportado = await Conductor.findOne({
    where: { usuarioId: reportadoId },
  });
  const pasajeroReportante = await Pasajero.findOne({
    where: { usuarioId: reportanteId },
  });
  const pasajeroReportado = await Pasajero.findOne({
    where: { usuarioId: reportadoId },
  });
  const conductorReportante = await Conductor.findOne({
    where: { usuarioId: reportanteId },
  });

  // Al menos uno de los dos debe haber participado en el viaje
  const reportadoEsConductor =
    conductorReportado && viaje.conductorId === conductorReportado.id;
  const reportadoEsPasajero = pasajeroReportado
    ? await Participacion.findOne({
        where: {
          viajeId,
          pasajeroId: pasajeroReportado.id,
          estado: "confirmado",
        },
      })
    : null;

  if (!reportadoEsConductor && !reportadoEsPasajero)
    throw apiError("El usuario reportado no participó en este viaje.", 400);

  // Verificar que el reportante participó
  const reportanteEsConductor =
    conductorReportante && viaje.conductorId === conductorReportante.id;
  const reportanteEsPasajero = pasajeroReportante
    ? await Participacion.findOne({
        where: {
          viajeId,
          pasajeroId: pasajeroReportante.id,
          estado: "confirmado",
        },
      })
    : null;

  if (!reportanteEsConductor && !reportanteEsPasajero)
    throw apiError("No participaste en este viaje.", 403);

  // Solo 1 reporte por par en el mismo viaje
  const yaReportó = await Reporte.findOne({
    where: { reportanteId, reportadoId, viajeId },
  });
  if (yaReportó)
    throw apiError(
      "Ya realizaste un reporte sobre este usuario en este viaje.",
      409,
    );

  return Reporte.create({
    reportanteId,
    reportadoId,
    viajeId,
    motivo: motivo.trim(),
    evidencia: evidencia || null,
    estado: "pendiente",
  });
};

/* ────────────────────────────────────────────────────────────
   RF10 — Editar reporte (hasta 10 min, sin respuesta admin)
   ─────────────────────────────────────────────────────────── */
exports.editarReporte = async (
  reporteId,
  reportanteId,
  { motivo, evidencia },
) => {
  const { Reporte } = M();

  const reporte = await Reporte.findOne({
    where: { id: reporteId, reportanteId },
  });
  if (!reporte) throw apiError("Reporte no encontrado.", 404);
  if (reporte.estado !== "pendiente")
    throw apiError("No puedes editar un reporte ya revisado.", 400);

  const minutosTranscurridos =
    (Date.now() - new Date(reporte.createdAt).getTime()) / 60_000;
  if (minutosTranscurridos > 10)
    throw apiError(
      "Solo puedes editar el reporte durante los primeros 10 minutos.",
      400,
    );

  const actualizar = {};
  if (motivo?.trim()) actualizar.motivo = motivo.trim();
  if (evidencia !== undefined) actualizar.evidencia = evidencia;

  return reporte.update(actualizar);
};

/* ────────────────────────────────────────────────────────────
   RF10 — Eliminar reporte (hasta que el admin lo atienda)
   ─────────────────────────────────────────────────────────── */
exports.eliminarReporte = async (reporteId, reportanteId) => {
  const { Reporte } = M();

  const reporte = await Reporte.findOne({
    where: { id: reporteId, reportanteId },
  });
  if (!reporte) throw apiError("Reporte no encontrado.", 404);
  if (reporte.estado !== "pendiente")
    throw apiError("No puedes eliminar un reporte ya revisado.", 400);

  await reporte.destroy();
  return { mensaje: "Reporte eliminado." };
};

/* ────────────────────────────────────────────────────────────
   RF10 — Mis reportes (como reportante)
   ─────────────────────────────────────────────────────────── */
exports.misReportes = async (reportanteId) => {
  const { Reporte, Usuario, Viaje } = M();

  return Reporte.findAll({
    where: { reportanteId },
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: Usuario,
        as: "reportado",
        attributes: ["id", "nombre", "apellido", "foto"],
      },
      {
        model: Viaje,
        as: "viaje",
        attributes: ["id", "origen", "destino", "fecha"],
      },
    ],
  });
};

/* ────────────────────────────────────────────────────────────
   RF11 — Admin: listar todos los reportes
   ─────────────────────────────────────────────────────────── */
exports.listarReportesAdmin = async ({ estado, page = 1, limit = 20 }) => {
  const { Reporte, Usuario, Viaje } = M();

  const where = {};
  if (estado) where.estado = estado;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { count, rows } = await Reporte.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit),
    offset,
    include: [
      {
        model: Usuario,
        as: "reportante",
        attributes: ["id", "nombre", "apellido", "correo", "foto"],
      },
      {
        model: Usuario,
        as: "reportado",
        attributes: [
          "id",
          "nombre",
          "apellido",
          "correo",
          "foto",
          "estado",
          "advertencias",
        ],
      },
      {
        model: Viaje,
        as: "viaje",
        attributes: ["id", "origen", "destino", "fecha"],
      },
    ],
  });

  return { total: count, pagina: parseInt(page), reportes: rows };
};

/* ────────────────────────────────────────────────────────────
   RF11 — Admin: obtener detalle de un reporte
   ─────────────────────────────────────────────────────────── */
exports.obtenerReporte = async (reporteId) => {
  const { Reporte, Usuario, Viaje, AccionAdministrativa } = M();

  const reporte = await Reporte.findByPk(reporteId, {
    include: [
      {
        model: Usuario,
        as: "reportante",
        attributes: ["id", "nombre", "apellido", "correo", "foto"],
      },
      {
        model: Usuario,
        as: "reportado",
        attributes: [
          "id",
          "nombre",
          "apellido",
          "correo",
          "foto",
          "estado",
          "advertencias",
        ],
      },
      {
        model: Viaje,
        as: "viaje",
        attributes: ["id", "origen", "destino", "fecha", "horaSalida"],
      },
      {
        model: AccionAdministrativa,
        as: "acciones",
        include: [
          {
            model: Usuario,
            as: "admin",
            attributes: ["id", "nombre", "apellido"],
          },
        ],
      },
    ],
  });

  if (!reporte) throw apiError("Reporte no encontrado.", 404);
  return reporte;
};

/* ────────────────────────────────────────────────────────────
   RF11 — Admin: advertir a un estudiante
   ─────────────────────────────────────────────────────────── */
exports.advertirEstudiante = async (
  adminId,
  { estudianteId, reporteId, descripcion },
) => {
  const { Usuario, AccionAdministrativa, Reporte } = M();

  const estudiante = await Usuario.findByPk(estudianteId);
  if (!estudiante) throw apiError("Estudiante no encontrado.", 404);
  if (estudiante.rol === "administrador")
    throw apiError("No puedes advertir a un administrador.", 400);

  const seq = require("../config/database").sequelize;

  await seq.transaction(async (t) => {
    // Registrar acción
    await AccionAdministrativa.create(
      {
        adminId,
        estudianteId,
        reporteId: reporteId || null,
        tipo: "advertencia",
        descripcion: descripcion?.trim() || null,
      },
      { transaction: t },
    );

    // El trigger en la BD incrementa advertencias y suspende si llega a 3.
    // Aquí lo hacemos también en JS como respaldo:
    const nuevasAdvert = (estudiante.advertencias || 0) + 1;
    const nuevoEstado = nuevasAdvert >= 3 ? "suspendido" : estudiante.estado;

    await estudiante.update(
      {
        advertencias: nuevasAdvert,
        estado: nuevoEstado,
      },
      { transaction: t },
    );

    // Marcar reporte como revisado
    if (reporteId) {
      await Reporte.update(
        { estado: "revisado" },
        { where: { id: reporteId }, transaction: t },
      );
    }
  });

  return {
    mensaje: `Advertencia aplicada. El estudiante acumula ${(estudiante.advertencias || 0) + 1} advertencia(s).`,
    suspendido: (estudiante.advertencias || 0) + 1 >= 3,
  };
};

/* ────────────────────────────────────────────────────────────
   RF11 — Admin: suspender a un estudiante
   ─────────────────────────────────────────────────────────── */
exports.suspenderEstudiante = async (
  adminId,
  { estudianteId, reporteId, descripcion, duracionDias },
) => {
  const { Usuario, AccionAdministrativa, Reporte } = M();

  if (!duracionDias || duracionDias < 1)
    throw apiError("Debes indicar la duración de la suspensión en días.", 400);

  const estudiante = await Usuario.findByPk(estudianteId);
  if (!estudiante) throw apiError("Estudiante no encontrado.", 404);
  if (estudiante.rol === "administrador")
    throw apiError("No puedes suspender a un administrador.", 400);
  if (estudiante.estado === "suspendido")
    throw apiError("El estudiante ya está suspendido.", 400);

  const fechaFin = new Date();
  fechaFin.setDate(fechaFin.getDate() + parseInt(duracionDias));

  const seq = require("../config/database").sequelize;

  await seq.transaction(async (t) => {
    await AccionAdministrativa.create(
      {
        adminId,
        estudianteId,
        reporteId: reporteId || null,
        tipo: "suspension",
        descripcion: descripcion?.trim() || null,
        duracionDias: parseInt(duracionDias),
        fechaFin,
      },
      { transaction: t },
    );

    await estudiante.update({ estado: "suspendido" }, { transaction: t });

    if (reporteId) {
      await Reporte.update(
        { estado: "revisado" },
        { where: { id: reporteId }, transaction: t },
      );
    }
  });

  return {
    mensaje: `Estudiante suspendido por ${duracionDias} día(s). Suspensión hasta: ${fechaFin.toLocaleDateString("es-EC")}.`,
    fechaFin,
  };
};

/* ────────────────────────────────────────────────────────────
   RF11 — Admin: levantar suspensión
   ─────────────────────────────────────────────────────────── */
exports.levantarSuspension = async (adminId, estudianteId) => {
  const { Usuario } = M();

  const estudiante = await Usuario.findByPk(estudianteId);
  if (!estudiante) throw apiError("Estudiante no encontrado.", 404);
  if (estudiante.estado !== "suspendido")
    throw apiError("El estudiante no está suspendido.", 400);

  await estudiante.update({ estado: "activo" });
  return {
    mensaje:
      "Suspensión levantada. El estudiante puede volver a usar la plataforma.",
  };
};

/* ────────────────────────────────────────────────────────────
   RF11 — Admin: historial de acciones sobre un estudiante
   ─────────────────────────────────────────────────────────── */
exports.historialAcciones = async (estudianteId) => {
  const { AccionAdministrativa, Usuario } = M();

  return AccionAdministrativa.findAll({
    where: { estudianteId },
    order: [["createdAt", "DESC"]],
    include: [
      { model: Usuario, as: "admin", attributes: ["id", "nombre", "apellido"] },
    ],
  });
};
