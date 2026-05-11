const { Usuario, VerificacionCorreo } = require("../models");
const { signToken } = require("../config/jwt");
const emailService = require("./email.service");
const crypto = require("crypto");

const DOMAIN = process.env.INSTITUTIONAL_DOMAIN;

exports.registrar = async ({ nombre, apellido, correo, contrasena }) => {
  if (!correo.endsWith(`@${DOMAIN}`))
    throw new Error("Solo se permiten correos institucionales.");
  const existe = await Usuario.findOne({ where: { correo } });
  if (existe) throw new Error("El correo ya está registrado.");

  const usuario = await Usuario.create({
    nombre,
    apellido,
    correo,
    contrasena,
  });
  const codigo = crypto.randomInt(100000, 999999).toString();
  const expira = new Date(
    Date.now() + process.env.CODE_EXPIRES_MINUTES * 60 * 1000,
  );
  await VerificacionCorreo.create({ usuarioId: usuario.id, codigo, expira });
  await emailService.enviarCodigo(correo, nombre, codigo);
  return usuario;
};

exports.verificarCodigo = async (correo, codigo) => {
  const usuario = await Usuario.findOne({ where: { correo } });
  if (!usuario) throw new Error("Usuario no encontrado.");
  const verif = await VerificacionCorreo.findOne({
    where: { usuarioId: usuario.id, codigo },
  });
  if (!verif || verif.expira < new Date())
    throw new Error("Código inválido o expirado.");
  await usuario.update({ verificado: true });
  await verif.destroy();
};

exports.login = async (correo, contrasena) => {
  const usuario = await Usuario.findOne({ where: { correo } });
  if (!usuario || !(await usuario.verificarContrasena(contrasena)))
    throw new Error("Credenciales incorrectas.");
  if (!usuario.verificado)
    throw new Error("Verifica tu correo antes de iniciar sesión.");
  if (usuario.estado === "suspendido")
    throw new Error("Tu cuenta está suspendida.");
  const token = signToken({ id: usuario.id, rol: usuario.rol });
  return {
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
  };
};

exports.enviarCodigoRecuperacion = async (correo) => {
  const usuario = await Usuario.findOne({ where: { correo } });
  if (!usuario) return; // no revelar si existe
  const codigo = crypto.randomInt(100000, 999999).toString();
  const expira = new Date(Date.now() + 15 * 60 * 1000);
  await VerificacionCorreo.upsert({ usuarioId: usuario.id, codigo, expira });
  await emailService.enviarRecuperacion(correo, usuario.nombre, codigo);
};

exports.cambiarContrasena = async (correo, codigo, nuevaContrasena) => {
  const usuario = await Usuario.findOne({ where: { correo } });
  if (!usuario) throw new Error("Usuario no encontrado.");
  const verif = await VerificacionCorreo.findOne({
    where: { usuarioId: usuario.id, codigo },
  });
  if (!verif || verif.expira < new Date())
    throw new Error("Código inválido o expirado.");
  await usuario.update({ contrasena: nuevaContrasena });
  await verif.destroy();
};
