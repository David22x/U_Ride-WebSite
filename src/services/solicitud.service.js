const { Solicitud, Viaje, Participacion } = require("../models");

exports.crear = async (pasajeroId, viajeId) => {
  const viaje = await Viaje.findByPk(viajeId);
  if (!viaje) throw new Error("Viaje no encontrado.");
  if (viaje.cuposDisponibles <= 0) throw new Error("No hay cupos disponibles.");
  if (viaje.estado !== "publicado")
    throw new Error("El viaje ya no está disponible.");
  const existe = await Solicitud.findOne({
    where: { pasajeroId, viajeId, estado: "pendiente" },
  });
  if (existe)
    throw new Error("Ya tienes una solicitud pendiente para este viaje.");
  return Solicitud.create({ pasajeroId, viajeId });
};

exports.aceptar = async (solicitudId, conductorId) => {
  const solicitud = await Solicitud.findByPk(solicitudId, {
    include: ["viaje"],
  });
  if (!solicitud) throw new Error("Solicitud no encontrada.");
  if (solicitud.viaje.conductorId !== conductorId)
    throw new Error("Sin permiso.");
  if (solicitud.viaje.cuposDisponibles <= 0)
    throw new Error("Sin cupos disponibles.");
  await solicitud.update({ estado: "aceptada" });
  await solicitud.viaje.decrement("cuposDisponibles");
  await Participacion.create({
    viajeId: solicitud.viajeId,
    pasajeroId: solicitud.pasajeroId,
  });
  return solicitud;
};

exports.rechazar = async (solicitudId, conductorId) => {
  const solicitud = await Solicitud.findByPk(solicitudId, {
    include: ["viaje"],
  });
  if (!solicitud) throw new Error("Solicitud no encontrada.");
  if (solicitud.viaje.conductorId !== conductorId)
    throw new Error("Sin permiso.");
  return solicitud.update({ estado: "rechazada" });
};
