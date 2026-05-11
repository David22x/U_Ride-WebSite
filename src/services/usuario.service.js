const { Usuario } = require("../models");

exports.obtenerPerfil = async (id) => {
  const u = await Usuario.findByPk(id, {
    attributes: { exclude: ["contrasena"] },
  });
  if (!u) throw new Error("Usuario no encontrado.");
  return u;
};

exports.actualizarPerfil = async (id, datos) => {
  const u = await Usuario.findByPk(id);
  if (!u) throw new Error("Usuario no encontrado.");
  return u.update(datos);
};
