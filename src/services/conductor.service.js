const { Conductor } = require("../models");

exports.obtenerPorUsuario = async (usuarioId) => {
  return await Conductor.findOne({
    where: { usuario_id: usuarioId },
  });
};

exports.guardar = async (usuarioId, datos) => {
  const existente = await Conductor.findOne({
    where: { usuario_id: usuarioId },
  });

  if (existente) {
    await existente.update(datos);
    return existente;
  }

  return await Conductor.create({
    usuario_id: usuarioId,
    ...datos,
  });
};
