const authService = require("../services/auth.service");
const { validationResult } = require("express-validator");

exports.registro = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    const usuario = await authService.registrar(req.body);
    res
      .status(201)
      .json({
        mensaje: "Cuenta creada. Revisa tu correo para verificarla.",
        usuarioId: usuario.id,
      });
  } catch (err) {
    next(err);
  }
};

exports.verificarCodigo = async (req, res, next) => {
  try {
    await authService.verificarCodigo(req.body.correo, req.body.codigo);
    res.json({ mensaje: "Correo verificado correctamente." });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    const { token, usuario } = await authService.login(
      req.body.correo,
      req.body.contrasena,
    );
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ token, usuario });
  } catch (err) {
    next(err);
  }
};

exports.logout = (_req, res) => {
  res.clearCookie("token");
  res.json({ mensaje: "Sesión cerrada." });
};

exports.recuperarContrasena = async (req, res, next) => {
  try {
    await authService.enviarCodigoRecuperacion(req.body.correo);
    res.json({ mensaje: "Código enviado a tu correo." });
  } catch (err) {
    next(err);
  }
};

exports.cambiarContrasena = async (req, res, next) => {
  try {
    await authService.cambiarContrasena(
      req.body.correo,
      req.body.codigo,
      req.body.nuevaContrasena,
    );
    res.json({ mensaje: "Contraseña actualizada correctamente." });
  } catch (err) {
    next(err);
  }
};
