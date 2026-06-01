const {
  Solicitud,
  Viaje,
  Participacion,
  Pasajero,
  Conductor,
  Usuario,
} = require("../models");
const { Op } = require("sequelize");

function apiError(msg, status = 400) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

exports.crear = async (usuarioId, viajeId) => {
  const pasajero = await Pasajero.findOne({ where: { usuarioId } });

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
      pasajeroId: pasajero.id,
      viajeId,
      estado: { [Op.in]: ["pendiente", "aceptada"] },
    },
  });

  if (solicitudExistente) {
    throw apiError("Ya has solicitado un cupo para este viaje", 409);
  }

  return Solicitud.create({
    pasajeroId: pasajero.id,
    viajeId,
    estado: "pendiente",
  });
};

exports.aceptar = async (solicitudId, usuarioId) => {
  console.log("ACEPTAR SOLICITUD:", solicitudId);

  const conductor = await Conductor.findOne({
    where: { usuarioId },
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

  const viajeActual = await Viaje.findByPk(solicitud.viajeId);

  console.log(
    "ANTES DEL DECREMENT:",
    viajeActual.id,
    viajeActual.cuposDisponibles,
  );

  console.log("PASO 1");
  await solicitud.update({
    estado: "aceptada",
  });

  console.log("PASO 2");

  //await viajeActual.decrement("cuposDisponibles");
  const nuevoValor = Number(viajeActual.cuposDisponibles) - 1;

  console.log("TIPO:", typeof viajeActual.cuposDisponibles);
  console.log("VALOR ACTUAL:", viajeActual.cuposDisponibles);
  console.log("NUEVO VALOR:", nuevoValor);

  await Viaje.update(
    {
      cuposDisponibles: nuevoValor,
    },
    {
      where: {
        id: viajeActual.id,
      },
    },
  );

  await viajeActual.reload();

  console.log(
    "DESPUES DEL DECREMENT:",
    viajeActual.id,
    viajeActual.cuposDisponibles,
  );

  console.log("PASO 3");

  await Participacion.create({
    viajeId: solicitud.viajeId,
    pasajeroId: solicitud.pasajeroId,
    solicitudId: solicitud.id,
    estado: "confirmado",
  });

  console.log("PASO 4");

  return solicitud.reload();
};

exports.rechazar = async (solicitudId, usuarioId) => {
  const conductor = await Conductor.findOne({ where: { usuarioId } });
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

exports.pendientes = async (usuarioId) => {
  const conductor = await Conductor.findOne({ where: { usuarioId } });
  if (!conductor) return [];

  const viajes = await Viaje.findAll({
    where: { conductorId: conductor.id, estado: "publicado" },
    attributes: ["id"],
  });

  const viajeIds = viajes.map((v) => v.id);
  if (!viajeIds.length) return [];

  return Solicitud.findAll({
    where: {
      viajeId: { [Op.in]: viajeIds },
      estado: "pendiente",
    },
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
