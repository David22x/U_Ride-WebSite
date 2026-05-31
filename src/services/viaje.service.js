const { Viaje, ReglasViaje } = require("../models");
const { Op, fn, col } = require("sequelize");

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

exports.buscar = async ({ origen, destino, fecha }) => {
  const where = { estado: "publicado", cuposDisponibles: { [Op.gt]: 0 } };
  if (origen) where.origen = { [Op.like]: `%${origen}%` };
  if (destino) where.destino = { [Op.like]: `%${destino}%` };
  if (fecha) where.fecha = fecha;
  return Viaje.findAll({ where, include: ["conductor", "reglas"] });
};

exports.crear = async (conductorId, datos) => {
  const { notas, reglas, ...viajeData } = datos;
  const viaje = await Viaje.create({
    ...viajeData,
    conductorId,
    cuposDisponibles: viajeData.cuposTotal,
    notas,
  });
  if (reglas) await ReglasViaje.create({ viajeId: viaje.id, ...reglas });
  return viaje;
};

exports.obtenerPorId = async (id) => {
  const viaje = await Viaje.findByPk(id, {
    include: ["conductor", "reglas", "solicitudes"],
  });
  if (!viaje) throw new Error("Viaje no encontrado.");
  return viaje;
};

exports.actualizar = async (id, conductorId, datos) => {
  const viaje = await Viaje.findOne({ where: { id, conductorId } });
  if (!viaje) throw new Error("Viaje no encontrado o sin permiso.");
  if (viaje.estado !== "publicado")
    throw new Error("Solo puedes editar viajes publicados.");
  return viaje.update(datos);
};

exports.cancelar = async (id, conductorId) => {
  const viaje = await Viaje.findOne({ where: { id, conductorId } });
  if (!viaje) throw new Error("Viaje no encontrado o sin permiso.");
  if (viaje.estado === "finalizado")
    throw new Error("No puedes cancelar un viaje finalizado.");
  return viaje.update({ estado: "cancelado" });
};

/* ────────────────────────────────────────────────────────────
   RF3 — Publicar viaje
   ─────────────────────────────────────────────────────────── */
exports.crearViaje = async (usuarioId, datos) => {
  const { Conductor, Viaje, ReglasViaje } = M();

  const conductor = await Conductor.findOne({
    where: {
      usuario_id: usuarioId,
      activo: true,
    },
  });
  if (!conductor)
    throw apiError(
      "Necesitas completar tu perfil de conductor antes de publicar viajes.",
      403,
    );

  if (
    !conductor.vehiculo ||
    !conductor.placa ||
    !conductor.color ||
    !conductor.licencia
  ) {
    throw apiError(
      "Completa los datos de tu vehículo antes de publicar viajes.",
      403,
    );
  }

  const {
    origen,
    destino,
    fecha,
    horaSalida,
    horaLlegada,
    cuposTotal,
    notas,
    reglas,
  } = datos;

  if (
    !origen ||
    !destino ||
    !fecha ||
    !horaSalida ||
    !horaLlegada ||
    !cuposTotal
  )
    throw apiError("Todos los campos obligatorios deben estar presentes.", 400);

  if (horaSalida >= horaLlegada)
    throw apiError(
      "La hora de llegada debe ser mayor a la hora de salida.",
      400,
    );

  if (new Date(fecha) < new Date(new Date().toDateString()))
    throw apiError("La fecha del viaje no puede ser en el pasado.", 400);

  const seq = require("../config/database").sequelize;

  const viaje = await seq.transaction(async (t) => {
    const v = await Viaje.create(
      {
        conductorId: conductor.id,
        origen: origen.trim(),
        destino: destino.trim(),
        fecha,
        horaSalida,
        horaLlegada,
        cuposTotal: parseInt(cuposTotal),
        cuposDisponibles: parseInt(cuposTotal),
        estado: "publicado",
        notas: notas?.trim() || null,
      },
      { transaction: t },
    );

    // RF9 — Reglas de seguridad: se guardan junto al viaje
    if (reglas && reglas.trim()) {
      await ReglasViaje.create(
        {
          viajeId: v.id,
          descripcion: reglas.trim(),
          obligatoria: true,
        },
        { transaction: t },
      );
    }

    return v;
  });

  return exports.obtenerViajePorId(viaje.id);
};

/* ────────────────────────────────────────────────────────────
   RF4 — Buscar y filtrar viajes
   ─────────────────────────────────────────────────────────── */
exports.buscarViajes = async ({
  origen,
  destino,
  fecha,
  hora,
  soloDisponibles = true,
}) => {
  const { Viaje, ReglasViaje, Conductor, Usuario } = M();

  const where = { estado: "publicado" };

  if (soloDisponibles) where.cuposDisponibles = { [Op.gt]: 0 };
  if (fecha) where.fecha = fecha;
  if (origen) where.origen = { [Op.like]: `%${origen.trim()}%` };
  if (destino) where.destino = { [Op.like]: `%${destino.trim()}%` };
  if (hora) where.horaSalida = { [Op.gte]: hora };

  // Solo viajes futuros si no se especifica fecha
  if (!fecha)
    where.fecha = { [Op.gte]: new Date().toISOString().split("T")[0] };

  const viajes = await Viaje.findAll({
    where,
    order: [
      ["fecha", "ASC"],
      ["horaSalida", "ASC"],
    ],
    include: [
      { model: ReglasViaje, as: "reglas" },
      {
        model: Conductor,
        as: "conductor",
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id", "nombre", "apellido", "foto", "zona"],
          },
        ],
      },
    ],
  });

  // Agregar reputación promedio del conductor
  const seq = require("../config/database").sequelize;
  const { QueryTypes } = require("sequelize");

  const ids = viajes.map((v) => v.conductor?.usuario?.id).filter(Boolean);
  let repMap = {};

  if (ids.length) {
    const reps = await seq.query(
      `SELECT evaluado_id, ROUND(AVG(puntuacion),1) AS promedio, COUNT(*) AS total
       FROM calificaciones WHERE evaluado_id IN (:ids) GROUP BY evaluado_id`,
      { replacements: { ids }, type: QueryTypes.SELECT },
    );
    reps.forEach((r) => {
      repMap[r.evaluado_id] = { promedio: r.promedio, total: r.total };
    });
  }

  return viajes.map((v) => ({
    ...v.toJSON(),
    conductorReputacion: repMap[v.conductor?.usuario?.id] || null,
  }));
};

/* ────────────────────────────────────────────────────────────
   RF3 — Obtener detalle de un viaje (incluye reglas RF9)
   ─────────────────────────────────────────────────────────── */
exports.obtenerViajePorId = async (viajeId) => {
  const { Viaje, ReglasViaje, Conductor, Usuario, Participacion, Pasajero } =
    M();

  const viaje = await Viaje.findByPk(viajeId, {
    include: [
      { model: ReglasViaje, as: "reglas" },
      {
        model: Conductor,
        as: "conductor",
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: [
              "id",
              "nombre",
              "apellido",
              "foto",
              "zona",
              "telefono",
            ],
          },
        ],
      },
      {
        model: Participacion,
        as: "participantes",
        where: { estado: "confirmado" },
        required: false,
        include: [
          {
            model: Pasajero,
            as: "pasajero",
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["id", "nombre", "apellido", "foto"],
              },
            ],
          },
        ],
      },
    ],
  });

  if (!viaje) throw apiError("Viaje no encontrado.", 404);
  return viaje;
};

/* ────────────────────────────────────────────────────────────
   RF3 — Mis viajes publicados (conductor)
   ─────────────────────────────────────────────────────────── */
exports.misViajesComoCondcutor = async (usuarioId) => {
  const {
    Viaje,
    Conductor,
    ReglasViaje,
    Solicitud,
    Participacion,
    Pasajero,
    Usuario,
  } = M();

  const conductor = await Conductor.findOne({
    where: {
      usuario_id: usuarioId,
    },
  });
  if (!conductor) return [];

  return Viaje.findAll({
    where: { conductorId: conductor.id },
    order: [["fecha", "DESC"]],
    include: [
      { model: ReglasViaje, as: "reglas" },
      {
        model: Solicitud,
        as: "solicitudes",
        where: { estado: "pendiente" },
        required: false,
        include: [
          {
            model: Pasajero,
            as: "pasajero",
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["id", "nombre", "apellido", "foto", "zona"],
              },
            ],
          },
        ],
      },
      {
        model: Participacion,
        as: "participantes",
        where: { estado: "confirmado" },
        required: false,
        include: [
          {
            model: Pasajero,
            as: "pasajero",
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["id", "nombre", "apellido", "foto"],
              },
            ],
          },
        ],
      },
    ],
  });
};

/* ────────────────────────────────────────────────────────────
   RF3 — Mis viajes como pasajero
   ─────────────────────────────────────────────────────────── */
exports.misViajesComoPasajero = async (usuarioId) => {
  const { Viaje, Conductor, Usuario, Participacion, Pasajero } = M();

  const pasajero = await M().Pasajero.findOne({
    where: {
      usuario_id: usuarioId,
    },
  });
  if (!pasajero) return [];

  return Participacion.findAll({
    where: { pasajeroId: pasajero.id },
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: Viaje,
        as: "viaje",
        include: [
          {
            model: Conductor,
            as: "conductor",
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: ["id", "nombre", "apellido", "foto"],
              },
            ],
          },
        ],
      },
    ],
  });
};

/* ────────────────────────────────────────────────────────────
   RF3 — Modificar viaje (solo conductor dueño, sin pasajeros)
   ─────────────────────────────────────────────────────────── */
exports.modificarViaje = async (viajeId, usuarioId, datos) => {
  const { Viaje, Conductor, Participacion } = M();

  const conductor = await Conductor.findOne({
    where: {
      usuario_id: usuarioId,
    },
  });
  if (!conductor) throw apiError("Perfil de conductor no encontrado.", 403);

  const viaje = await Viaje.findOne({
    where: { id: viajeId, conductorId: conductor.id },
  });
  if (!viaje) throw apiError("Viaje no encontrado o no tienes permiso.", 404);
  if (viaje.estado !== "publicado")
    throw apiError("Solo puedes editar viajes publicados.", 400);

  const confirmados = await Participacion.count({
    where: { viajeId, estado: "confirmado" },
  });
  if (confirmados > 0)
    throw apiError("No puedes editar un viaje con pasajeros confirmados.", 400);

  const permitidos = [
    "origen",
    "destino",
    "fecha",
    "horaSalida",
    "horaLlegada",
    "cuposTotal",
    "notas",
  ];
  const actualizar = {};
  permitidos.forEach((k) => {
    if (datos[k] !== undefined) actualizar[k] = datos[k];
  });

  if (actualizar.cuposTotal) {
    actualizar.cuposDisponibles = parseInt(actualizar.cuposTotal);
  }

  return viaje.update(actualizar);
};

/* ────────────────────────────────────────────────────────────
   RF3 — Cancelar viaje
   ─────────────────────────────────────────────────────────── */
exports.cancelarViaje = async (viajeId, usuarioId) => {
  const { Viaje, Conductor } = M();

  const conductor = await Conductor.findOne({
    where: {
      usuario_id: usuarioId,
    },
  });
  if (!conductor) throw apiError("Perfil de conductor no encontrado.", 403);

  const viaje = await Viaje.findOne({
    where: { id: viajeId, conductorId: conductor.id },
  });
  if (!viaje) throw apiError("Viaje no encontrado o sin permiso.", 404);
  if (viaje.estado === "finalizado")
    throw apiError("No puedes cancelar un viaje finalizado.", 400);
  if (viaje.estado === "cancelado")
    throw apiError("El viaje ya está cancelado.", 400);

  return viaje.update({ estado: "cancelado" });
};

/* ────────────────────────────────────────────────────────────
   RF5 — Pasajero envía solicitud para unirse
   ─────────────────────────────────────────────────────────── */
exports.enviarSolicitud = async (usuarioId, viajeId) => {
  const { Pasajero, Viaje, Solicitud, Conductor } = M();

  const pasajero = await Pasajero.findOne({
    where: {
      usuario_id: usuarioId,
    },
  });
  if (!pasajero) throw apiError("Perfil de pasajero no encontrado.", 403);

  const viaje = await Viaje.findByPk(viajeId, {
    include: [{ model: Conductor, as: "conductor" }],
  });
  if (!viaje) throw apiError("Viaje no encontrado.", 404);
  if (viaje.estado !== "publicado")
    throw apiError("Este viaje ya no está disponible.", 400);
  if (viaje.cuposDisponibles <= 0)
    throw apiError("No hay cupos disponibles.", 400);

  // No puede solicitar su propio viaje
  if (viaje.conductor?.usuarioId === usuarioId)
    throw apiError("No puedes solicitar unirte a tu propio viaje.", 400);

  // Solicitud ya existente
  const yaExiste = await Solicitud.findOne({
    where: {
      pasajeroId: pasajero.id,
      viajeId,
      estado: { [Op.in]: ["pendiente", "aceptada"] },
    },
  });
  if (yaExiste)
    throw apiError("Ya tienes una solicitud activa para este viaje.", 409);

  return Solicitud.create({
    viajeId,
    pasajeroId: pasajero.id,
    estado: "pendiente",
  });
};

/* ────────────────────────────────────────────────────────────
   RF5 — Cancelar solicitud (pasajero)
   ─────────────────────────────────────────────────────────── */
exports.cancelarSolicitud = async (solicitudId, usuarioId) => {
  const { Solicitud, Pasajero } = M();

  const pasajero = await Pasajero.findOne({
    where: {
      usuario_id: usuarioId,
    },
  });
  if (!pasajero) throw apiError("Perfil no encontrado.", 403);

  const solicitud = await Solicitud.findOne({
    where: { id: solicitudId, pasajeroId: pasajero.id },
  });
  if (!solicitud) throw apiError("Solicitud no encontrada.", 404);
  if (solicitud.estado !== "pendiente")
    throw apiError("Solo puedes cancelar solicitudes pendientes.", 400);

  return solicitud.update({ estado: "cancelada" });
};

/* ────────────────────────────────────────────────────────────
   RF6 — Conductor acepta solicitud  →  RF7 crea participación
   ─────────────────────────────────────────────────────────── */
exports.aceptarSolicitud = async (solicitudId, usuarioId) => {
  const { Solicitud, Viaje, Conductor, Participacion } = M();

  const conductor = await Conductor.findOne({
    where: {
      usuario_id: usuarioId,
    },
  });
  if (!conductor) throw apiError("Perfil de conductor no encontrado.", 403);

  const solicitud = await Solicitud.findByPk(solicitudId, {
    include: [{ model: Viaje, as: "viaje" }],
  });
  if (!solicitud) throw apiError("Solicitud no encontrada.", 404);
  if (solicitud.viaje.conductorId !== conductor.id)
    throw apiError("Sin permiso.", 403);
  if (solicitud.estado !== "pendiente")
    throw apiError("Esta solicitud ya fue procesada.", 400);
  if (solicitud.viaje.cuposDisponibles <= 0)
    throw apiError("Sin cupos disponibles.", 400);

  const seq = require("../config/database").sequelize;

  await seq.transaction(async (t) => {
    // RF6 — aceptar
    await solicitud.update({ estado: "aceptada" }, { transaction: t });

    // RF7 — registrar participación confirmada
    await Participacion.create(
      {
        viajeId: solicitud.viajeId,
        pasajeroId: solicitud.pasajeroId,
        solicitudId: solicitud.id,
        estado: "confirmado",
      },
      { transaction: t },
    );

    // Decrementar cupos (el trigger también lo hace, doble seguridad)
    await solicitud.viaje.decrement("cuposDisponibles", { transaction: t });
  });

  return solicitud.reload();
};

/* ────────────────────────────────────────────────────────────
   RF6 — Conductor rechaza solicitud
   ─────────────────────────────────────────────────────────── */
exports.rechazarSolicitud = async (solicitudId, usuarioId) => {
  const { Solicitud, Viaje, Conductor } = M();

  const conductor = await Conductor.findOne({
    where: {
      usuario_id: usuarioId,
    },
  });
  if (!conductor) throw apiError("Perfil de conductor no encontrado.", 403);

  const solicitud = await Solicitud.findByPk(solicitudId, {
    include: [{ model: Viaje, as: "viaje" }],
  });
  if (!solicitud) throw apiError("Solicitud no encontrada.", 404);
  if (solicitud.viaje.conductorId !== conductor.id)
    throw apiError("Sin permiso.", 403);
  if (solicitud.estado !== "pendiente")
    throw apiError("Esta solicitud ya fue procesada.", 400);

  return solicitud.update({ estado: "rechazada" });
};

/* ────────────────────────────────────────────────────────────
   RF6 — Solicitudes pendientes del conductor
   ─────────────────────────────────────────────────────────── */
exports.solicitudesPendientes = async (usuarioId) => {
  const { Solicitud, Viaje, Conductor, Pasajero, Usuario } = M();

  const conductor = await Conductor.findOne({
    where: { usuario_id: usuarioId },
  });
  if (!conductor) return [];

  const viajes = await Viaje.findAll({
    where: { conductorId: conductor.id, estado: "publicado" },
    attributes: ["id"],
  });

  const viajeIds = viajes.map((v) => v.id);
  if (!viajeIds.length) return [];

  return Solicitud.findAll({
    where: { viajeId: { [Op.in]: viajeIds }, estado: "pendiente" },
    order: [["fechaEnvio", "ASC"]],
    include: [
      { model: Viaje, as: "viaje" },
      {
        model: Pasajero,
        as: "pasajero",
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id", "nombre", "apellido", "foto", "zona", "carrera"],
          },
        ],
      },
    ],
  });
};
