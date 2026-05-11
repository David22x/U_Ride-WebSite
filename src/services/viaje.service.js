const { Viaje, ReglasViaje } = require("../models");
const { Op } = require("sequelize");

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
