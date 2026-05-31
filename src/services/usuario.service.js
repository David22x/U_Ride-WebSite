const { Op } = require("sequelize");

let _m = null;
const M = () => {
  if (!_m) _m = require("../models");
  return _m;
};

exports.actualizar = async (id, datos) => {
  const { Usuario } = M();
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new Error("Usuario no encontrado");
  const permitidos = ["nombre", "apellido", "carrera", "zona", "telefono"];
  const actualizar = {};
  permitidos.forEach((k) => { if (datos[k] !== undefined) actualizar[k] = datos[k]; });
  await usuario.update(actualizar);
  return usuario;
};

exports.obtenerStats = async (usuarioId) => {
  const { Viaje, Calificacion, Conductor, Participacion, Pasajero } = M();
  const { fn, col } = require("sequelize");

  let totalViajes = 0;

  // Viajes como conductor
  const conductor = await Conductor.findOne({ where: { usuario_id: usuarioId } });
  if (conductor) {
    totalViajes += await Viaje.count({ where: { conductor_id: conductor.id, estado: "finalizado" } });
  }

  // Viajes como pasajero
  const pasajero = await Pasajero.findOne({ where: { usuario_id: usuarioId } });
  if (pasajero) {
    totalViajes += await Participacion.count({ where: { pasajero_id: pasajero.id, estado: "confirmado" } });
  }

  const promedioRow = await Calificacion.findOne({
    attributes: [[fn("AVG", col("puntuacion")), "promedio"]],
    where: { evaluado_id: usuarioId },
    raw: true,
  });

  return {
    totalViajes,
    promedio: promedioRow?.promedio ? parseFloat(promedioRow.promedio).toFixed(1) : null,
  };
};
