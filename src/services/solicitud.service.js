const { Solicitud, Viaje, Participacion, Pasajero, Conductor, Usuario } = require("../models");
const { Op } = require("sequelize");

function apiError(msg, status = 400) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

exports.crear = async (usuarioId, viajeId) => {
  const pasajero = await Pasajero.findOne({
    where: { usuario_id: usuarioId },
  });

  if (!pasajero) {
    throw apiError("Perfil de pasajero no encontrado", 404);
  }

  const viaje = await Viaje.findByPk(viajeId);

  if (!viaje) {
    throw apiError("Viaje no encontrado", 404);
  }

  if (viaje.estado !== "publicado") {
    throw apiError("Este viaje ya no está disponible.", 400);
  }

  if (viaje.cuposDisponibles <= 0) {
    throw apiError("No hay cupos disponibles.", 400);
  }

  const solicitudExistente = await Solicitud.findOne({
    where: {
      pasajero_id: pasajero.id,
      viaje_id: viajeId,
      estado: { [Op.in]: ["pendiente", "aceptada"] },
    },
  });

  if (solicitudExistente) {
    throw apiError("Ya has solicitado un cupo para este viaje", 409);
  }

  return Solicitud.create({
    pasajero_id: pasajero.id,
    viaje_id: viajeId,
    estado: "pendiente",
  });
};

exports.aceptar = async (solicitudId, usuarioId) => {
  const conductor = await Conductor.findOne({ where: { usuario_id: usuarioId } });
  if (!conductor) throw apiError("Perfil de conductor no encontrado.", 403);

  const solicitud = await Solicitud.findByPk(solicitudId, {
    include: [{ model: Viaje, as: "viaje" }],
  });
  if (!solicitud) throw apiError("Solicitud no encontrada.", 404);
  if (solicitud.viaje.conductor_id !== conductor.id)
    throw apiError("Sin permiso.", 403);
  if (solicitud.estado !== "pendiente")
    throw apiError("Esta solicitud ya fue procesada.", 400);
  if (solicitud.viaje.cuposDisponibles <= 0)
    throw apiError("Sin cupos disponibles.", 400);

  await solicitud.update({ estado: "aceptada" });
  await solicitud.viaje.decrement("cupos_disponibles");
  await Participacion.create({
    viaje_id: solicitud.viaje_id,
    pasajero_id: solicitud.pasajero_id,
    estado: "confirmado",
  });
  return solicitud.reload();
};

exports.rechazar = async (solicitudId, usuarioId) => {
  const conductor = await Conductor.findOne({ where: { usuario_id: usuarioId } });
  if (!conductor) throw apiError("Perfil de conductor no encontrado.", 403);

  const solicitud = await Solicitud.findByPk(solicitudId, {
    include: [{ model: Viaje, as: "viaje" }],
  });
  if (!solicitud) throw apiError("Solicitud no encontrada.", 404);
  if (solicitud.viaje.conductor_id !== conductor.id)
    throw apiError("Sin permiso.", 403);
  if (solicitud.estado !== "pendiente")
    throw apiError("Esta solicitud ya fue procesada.", 400);

  return solicitud.update({ estado: "rechazada" });
};

exports.pendientes = async (usuarioId) => {
  const conductor = await Conductor.findOne({ where: { usuario_id: usuarioId } });
  if (!conductor) return [];

  const viajes = await Viaje.findAll({
    where: { conductor_id: conductor.id, estado: "publicado" },
    attributes: ["id"],
  });

  const viajeIds = viajes.map((v) => v.id);
  if (!viajeIds.length) return [];

  return Solicitud.findAll({
    where: {
      viaje_id: { [Op.in]: viajeIds },
      estado: "pendiente",
    },
    order: [["fecha_envio", "ASC"]],
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
