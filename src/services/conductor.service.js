const { Conductor } = require("../models");

exports.obtenerPorUsuario = async (usuarioId) => {
  return await Conductor.findOne({ where: { usuarioId } });
};

exports.guardar = async (usuarioId, datos) => {
  const existente = await Conductor.findOne({ where: { usuarioId } });

  if (existente) {
    await existente.update(datos);
    return existente;
  }

  return await Conductor.create({ usuarioId, ...datos });
};
