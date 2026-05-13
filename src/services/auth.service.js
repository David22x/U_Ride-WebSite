/* ============================================================
   U-Ride — src/services/auth.service.js
   ============================================================ */

const db = require("../config/database");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { signToken } = require("../config/jwt");
const emailService = require("./email.service");

const DOMAIN = process.env.INSTITUTIONAL_DOMAIN || "uta.edu.ec";
const CODE_MINUTES = parseInt(process.env.CODE_EXPIRES_MINUTES || "15", 10);

/* ── Helpers ───────────────────────────────────────────── */
function genCodigo() {
  return crypto.randomInt(100000, 999999).toString();
}

function calcExpiracion(minutos = CODE_MINUTES) {
  return new Date(Date.now() + minutos * 60000);
}

function apiError(msg, status = 400) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

/* ── Modelos ───────────────────────────────────────────── */
let _models = null;

function models() {
  if (!_models) _models = require("../models");
  return _models;
}

/* ============================================================
   PASO 1 — Registro temporal + envío OTP
   ============================================================ */
exports.iniciarRegistro = async ({
  nombre,
  apellido,
  correo,
  contrasena,
  carrera,
  zona,
}) => {
  if (!correo.endsWith(`@${DOMAIN}`)) {
    throw apiError(`Solo se permiten correos @${DOMAIN}`, 400);
  }

  const { Usuario, RegistroPendiente } = models();

  const existe = await Usuario.findOne({
    where: { correo },
  });

  if (existe) {
    throw apiError("Este correo ya tiene una cuenta activa.", 409);
  }

  await RegistroPendiente.update(
    { usado: true },
    { where: { correo, usado: false } },
  );

  const hash = await bcrypt.hash(contrasena, 12);

  const codigo = genCodigo();
  const expira = calcExpiracion();

  await RegistroPendiente.create({
    correo,
    nombre,
    apellido,
    contrasena_hash: hash,
    carrera: carrera || null,
    zona: zona || null,
    codigo,
    expira_en: expira,
    usado: false,
  });

  await emailService.enviarCodigoRegistro(correo, nombre, codigo);

  return {
    mensaje: "Código enviado. Revisa tu correo.",
  };
};

/* ============================================================
   PASO 2 — Verificar código
   ============================================================ */
exports.verificarCodigo = async (correo, codigo) => {
  const { Usuario, RegistroPendiente } = models();

  const pendiente = await RegistroPendiente.findOne({
    where: {
      correo,
      codigo,
      usado: false,
      expira_en: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!pendiente) {
    throw apiError("Código incorrecto o expirado.", 400);
  }

  const yaExiste = await Usuario.findOne({
    where: { correo },
  });

  if (yaExiste) {
    await pendiente.update({ usado: true });

    throw apiError("Este correo ya tiene una cuenta activa.", 409);
  }

  const usuario = await Usuario.create(
    {
      nombre: pendiente.nombre,
      apellido: pendiente.apellido,
      correo: pendiente.correo,
      contrasena: pendiente.contrasena_hash,
      carrera: pendiente.carrera,
      zona: pendiente.zona,
      verificado: true,
      estado: "activo",
    },
    {
      hooks: false,
    },
  );

  await pendiente.update({
    usado: true,
  });

  return {
    usuarioId: usuario.id,
    mensaje: "Cuenta creada correctamente.",
  };
};

/* ============================================================
   Reenviar código
   ============================================================ */
exports.reenviarCodigo = async (correo) => {
  const { RegistroPendiente } = models();

  const pendiente = await RegistroPendiente.findOne({
    where: {
      correo,
      usado: false,
    },
    order: [["created_at", "DESC"]],
  });

  if (!pendiente) return;

  await pendiente.update({
    usado: true,
  });

  const codigo = genCodigo();

  await RegistroPendiente.create({
    correo,
    nombre: pendiente.nombre,
    apellido: pendiente.apellido,
    contrasena_hash: pendiente.contrasena_hash,
    carrera: pendiente.carrera,
    zona: pendiente.zona,
    codigo,
    expira_en: calcExpiracion(),
    usado: false,
  });

  await emailService.enviarCodigoRegistro(correo, pendiente.nombre, codigo);
};

/* ============================================================
   Login
   ============================================================ */
exports.login = async (correo, contrasena) => {
  const { Usuario } = models();

  const errGen = apiError("Correo o contraseña incorrectos.", 401);

  const usuario = await Usuario.findOne({
    where: { correo },
  });

  if (!usuario) throw errGen;

  const passOk = await bcrypt.compare(contrasena, usuario.contrasena);

  if (!passOk) throw errGen;

  if (!usuario.verificado) {
    throw apiError("Verifica tu correo antes de iniciar sesión.", 403);
  }

  if (usuario.estado === "suspendido") {
    throw apiError("Tu cuenta está suspendida.", 403);
  }

  if (usuario.estado === "inactivo") {
    throw apiError("Tu cuenta está inactiva.", 403);
  }

  const token = signToken({
    id: usuario.id,
    rol: usuario.rol,
  });

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      rol: usuario.rol,
      foto: usuario.foto,
    },
  };
};

/* ============================================================
   Recuperar contraseña
   ============================================================ */
exports.enviarRecuperacion = async (correo) => {
  const { Usuario, VerificacionCorreo } = models();

  const usuario = await Usuario.findOne({
    where: {
      correo,
      verificado: true,
    },
  });

  if (!usuario) return;

  await VerificacionCorreo.update(
    { usado: true },
    {
      where: {
        usuario_id: usuario.id,
        tipo: "recuperacion",
        usado: false,
      },
    },
  );

  const codigo = genCodigo();

  await VerificacionCorreo.create({
    usuario_id: usuario.id,
    codigo,
    tipo: "recuperacion",
    expira_en: calcExpiracion(15),
    usado: false,
  });

  await emailService.enviarCodigoRecuperacion(correo, usuario.nombre, codigo);
};

/* ============================================================
   Cambiar contraseña
   ============================================================ */
exports.cambiarContrasena = async (correo, codigo, nuevaContrasena) => {
  const { Usuario, VerificacionCorreo } = models();

  const usuario = await Usuario.findOne({
    where: { correo },
  });

  if (!usuario) {
    throw apiError("Usuario no encontrado.", 404);
  }

  const verif = await VerificacionCorreo.findOne({
    where: {
      usuario_id: usuario.id,
      codigo,
      tipo: "recuperacion",
      usado: false,
      expira_en: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!verif) {
    throw apiError("Código incorrecto o expirado.", 400);
  }

  const hash = await bcrypt.hash(nuevaContrasena, 12);

  await usuario.update(
    {
      contrasena: hash,
    },
    {
      hooks: false,
    },
  );

  await verif.update({
    usado: true,
  });

  return {
    mensaje: "Contraseña actualizada correctamente.",
  };
};
