/* ============================================================
   U-Ride — calificacion.service.js
   RF8  Calificación y reseña después del viaje
   ============================================================ */

const { Op } = require("sequelize");

let _m = null;
const M = () => {
  if (!_m) _m = require("../models");
  return _m;
};

function apiError(msg, status = 400) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

/* ────────────────────────────────────────────────────────────
   RF8 — Calificar a otro usuario después de un viaje
   ─────────────────────────────────────────────────────────── */
exports.calificar = async (evaluadorId, viajeId, evaluadoId, puntuacion) => {
  const { Calificacion, Viaje, Participacion, Conductor, Pasajero } = M();

  if (evaluadorId === evaluadoId)
    throw apiError("No puedes calificarte a ti mismo.", 400);

  if (!puntuacion || puntuacion < 1 || puntuacion > 5)
    throw apiError("La puntuación debe estar entre 1 y 5.", 400);

  const viaje = await Viaje.findByPk(viajeId);
  if (!viaje) throw apiError("Viaje no encontrado.", 404);
  if (viaje.estado !== "finalizado")
    throw apiError("Solo puedes calificar viajes finalizados.", 400);

  // Verificar que el evaluador participó en el viaje
  const conductorEval = await Conductor.findOne({ where: { usuarioId: evaluadorId } });
  const pasajeroEval = await Pasajero.findOne({ where: { usuarioId: evaluadorId } });

  const esConductorDelViaje = conductorEval && viaje.conductorId === conductorEval.id;
  const esPasajeroDelViaje = pasajeroEval
    ? await Participacion.findOne({
        where: { viajeId, pasajeroId: pasajeroEval.id, estado: "confirmado" },
      })
    : null;

  if (!esConductorDelViaje && !esPasajeroDelViaje)
    throw apiError("No participaste en este viaje.", 403);

  // Verificar que el evaluado participó en el viaje
  const conductorEval2 = await Conductor.findOne({ where: { usuarioId: evaluadoId } });
  const pasajeroEval2 = await Pasajero.findOne({ where: { usuarioId: evaluadoId } });

  const esConductorEvaluado = conductorEval2 && viaje.conductorId === conductorEval2.id;
  const esPasajeroEvaluado = pasajeroEval2
    ? await Participacion.findOne({
        where: { viajeId, pasajeroId: pasajeroEval2.id, estado: "confirmado" },
      })
    : null;

  if (!esConductorEvaluado && !esPasajeroEvaluado)
    throw apiError("El usuario evaluado no participó en este viaje.", 400);

  // Solo 1 calificación por par en el mismo viaje
  const yaCalificó = await Calificacion.findOne({
    where: { evaluadorId, evaluadoId, viajeId },
  });
  if (yaCalificó)
    throw apiError("Ya calificaste a este usuario en este viaje.", 409);

  return Calificacion.create({
    evaluadorId,
    evaluadoId,
    viajeId,
    puntuacion: parseFloat(puntuacion),
  });
};

/* ────────────────────────────────────────────────────────────
   RF8 — Reseña (comentario) después del viaje
   ─────────────────────────────────────────────────────────── */
exports.resenar = async (autorId, viajeId, destinoId, comentario) => {
  const { Resena, Viaje } = M();

  if (!comentario?.trim() || comentario.trim().length < 3)
    throw apiError("El comentario debe tener al menos 3 caracteres.", 400);

  const viaje = await Viaje.findByPk(viajeId);
  if (!viaje) throw apiError("Viaje no encontrado.", 404);

  return Resena.create({
    autorId,
    viajeId,
    destinoId,
    comentario: comentario.trim(),
  });
};

/* ────────────────────────────────────────────────────────────
   Obtener reputación de un usuario (promedio + total viajes)
   ─────────────────────────────────────────────────────────── */
exports.obtenerReputacion = async (usuarioId) => {
  const { Calificacion, Resena, Usuario } = M();
  const { fn, col } = require("sequelize");

  const usuario = await Usuario.findByPk(usuarioId, {
    attributes: ["id", "nombre", "apellido", "foto"],
  });
  if (!usuario) throw apiError("Usuario no encontrado.", 404);

  const stats = await Calificacion.findOne({
    attributes: [
      [fn("AVG", col("puntuacion")), "promedio"],
      [fn("COUNT", col("id")), "total"],
    ],
    where: { evaluadoId: usuarioId },
    raw: true,
  });

  const resenas = await Resena.findAll({
    where: { destinoId: usuarioId },
    order: [["created_at", "DESC"]],
    limit: 10,
    include: [
      {
        model: Usuario,
        as: "autor",
        attributes: ["id", "nombre", "apellido", "foto"],
      },
    ],
  });

  return {
    usuario,
    promedio: stats?.promedio ? parseFloat(stats.promedio).toFixed(1) : null,
    totalCalificaciones: parseInt(stats?.total || 0),
    resenas,
  };
};

/* ────────────────────────────────────────────────────────────
   Viajes pendientes de calificar por el usuario
   ─────────────────────────────────────────────────────────── */
exports.pendientesDeCalificar = async (usuarioId) => {
  const { Viaje, Participacion, Conductor, Pasajero, Calificacion, Usuario } = M();

  const resultados = [];

  // Viajes donde fue pasajero confirmado y el viaje está finalizado
  const pasajero = await Pasajero.findOne({ where: { usuarioId } });
  if (pasajero) {
    const participaciones = await Participacion.findAll({
      where: { pasajeroId: pasajero.id, estado: "confirmado" },
      include: [
        {
          model: Viaje,
          as: "viaje",
          where: { estado: "finalizado" },
          include: [
            {
              model: Conductor,
              as: "conductor",
              include: [{ model: Usuario, as: "usuario", attributes: ["id", "nombre", "apellido"] }],
            },
          ],
        },
      ],
    });

    for (const p of participaciones) {
      const conductorUsuarioId = p.viaje.conductor?.usuario?.id;
      if (!conductorUsuarioId) continue;
      const yaCalificó = await Calificacion.findOne({
        where: { evaluadorId: usuarioId, evaluadoId: conductorUsuarioId, viajeId: p.viajeId },
      });
      if (!yaCalificó) {
        resultados.push({
          tipo: "conductor",
          viaje: p.viaje,
          evaluado: p.viaje.conductor?.usuario,
        });
      }
    }
  }

  // Viajes donde fue conductor y el viaje está finalizado
  const conductor = await Conductor.findOne({ where: { usuarioId } });
  if (conductor) {
    const viajes = await Viaje.findAll({
      where: { conductorId: conductor.id, estado: "finalizado" },
      include: [
        {
          model: Participacion,
          as: "participantes",
          where: { estado: "confirmado" },
          required: false,
          include: [
            {
              model: Pasajero,
              as: "pasajero",
              include: [{ model: Usuario, as: "usuario", attributes: ["id", "nombre", "apellido"] }],
            },
          ],
        },
      ],
    });

    for (const v of viajes) {
      for (const part of v.participantes || []) {
        const pasajeroUsuarioId = part.pasajero?.usuario?.id;
        if (!pasajeroUsuarioId) continue;
        const yaCalificó = await Calificacion.findOne({
          where: { evaluadorId: usuarioId, evaluadoId: pasajeroUsuarioId, viajeId: v.id },
        });
        if (!yaCalificó) {
          resultados.push({
            tipo: "pasajero",
            viaje: v,
            evaluado: part.pasajero?.usuario,
          });
        }
      }
    }
  }

  return resultados;
};

exports.editarCalificacion = async (id, evaluadorId, puntuacion) => {
  const { Calificacion } = M();
  const cal = await Calificacion.findOne({ where: { id, evaluadorId } });
  if (!cal) throw apiError("Calificación no encontrada.", 404);
  if (puntuacion < 1 || puntuacion > 5) throw apiError("Puntuación inválida.", 400);
  return cal.update({ puntuacion });
};

exports.editarResena = async (id, autorId, comentario) => {
  const { Resena } = M();
  const r = await Resena.findOne({ where: { id, autorId } });
  if (!r) throw apiError("Reseña no encontrada.", 404);
  return r.update({ comentario: comentario.trim() });
};
