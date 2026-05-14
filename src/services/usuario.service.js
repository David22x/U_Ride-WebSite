const { Viaje, Calificacion } = require("../models");
const { fn, col } = require("sequelize");
const { Usuario } = require("../models");

exports.actualizar = async (id, datos) => {
  const usuario = await Usuario.findByPk(id);

  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  await usuario.update(datos);

  return usuario;
};

exports.obtenerStats = async (usuarioId) => {
  /* Total viajes */
  const totalViajes = await Viaje.count({
    where: {
      conductor_id: usuarioId,
    },
  });

  /* Promedio calificaciones */
  const promedio = await Calificacion.findOne({
    attributes: [[fn("AVG", col("puntuacion")), "promedio"]],
    where: {
      evaluado_id: usuarioId,
    },
    raw: true,
  });

  return {
    total_viajes: totalViajes,
    promedio: promedio?.promedio
      ? parseFloat(promedio.promedio).toFixed(1)
      : null,
  };
};
