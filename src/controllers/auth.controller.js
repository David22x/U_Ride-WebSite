const authService = require("../services/auth.service");
const { validationResult } = require("express-validator");

function checkValidation(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      error: errors.array()[0].msg,
    });

    return false;
  }

  return true;
}

/* ============================================================
   POST /api/auth/registro
   ============================================================ */
exports.registro = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const result = await authService.iniciarRegistro(req.body);

    res.status(202).json(result);
  } catch (err) {
    next(err);
  }
};

/* ============================================================
   POST /api/auth/verificar-codigo
   ============================================================ */
exports.verificarCodigo = async (req, res, next) => {
  try {
    const { correo, codigo } = req.body;

    if (!correo || !codigo) {
      return res.status(400).json({
        error: "Correo y código son requeridos.",
      });
    }

    const result = await authService.verificarCodigo(correo, codigo.trim());

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/* ============================================================
   POST /api/auth/reenviar-codigo
   ============================================================ */
exports.reenviarCodigo = async (req, res, next) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({
        error: "El correo es requerido.",
      });
    }

    await authService.reenviarCodigo(correo);

    res.json({
      mensaje:
        "Si el correo existe y no fue verificado, recibirás un nuevo código.",
    });
  } catch (err) {
    next(err);
  }
};

/* ============================================================
   POST /api/auth/login
   ============================================================ */
exports.login = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;

    const { correo, contrasena } = req.body;

    const { token, usuario } = await authService.login(correo, contrasena);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      token,
      usuario,
    });
  } catch (err) {
    next(err);
  }
};

/* ============================================================
   POST /api/auth/logout
   ============================================================ */
exports.logout = (_req, res) => {
  res.clearCookie("token");

  res.json({
    mensaje: "Sesión cerrada.",
  });
};

/* ============================================================
   POST /api/auth/recuperar-contrasena
   ============================================================ */
exports.recuperarContrasena = async (req, res, next) => {
  try {
    const { correo } = req.body;
    if (!correo)
      return res.status(400).json({ error: "El correo es requerido." });
    await authService.enviarRecuperacion(correo.trim().toLowerCase());
    // Siempre 200 para no revelar si el correo existe
    res.json({
      mensaje: "Si el correo está registrado, recibirás un código en breve.",
    });
  } catch (err) {
    next(err);
  }
};

exports.verificarCodigoRecuperacion = async (req, res, next) => {
  try {
    const { correo, codigo } = req.body;
    if (!correo || !codigo)
      return res.status(400).json({ error: "Correo y código son requeridos." });
    const result = await authService.verificarCodigoRecuperacion(
      correo.trim().toLowerCase(),
      codigo.trim(),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* ============================================================
   POST /api/auth/cambiar-contrasena
   ============================================================ */
exports.cambiarContrasena = async (req, res, next) => {
  try {
    const { correo, codigo, nuevaContrasena } = req.body;
    if (!correo || !codigo || !nuevaContrasena)
      return res
        .status(400)
        .json({ error: "Todos los campos son requeridos." });
    const result = await authService.cambiarContrasena(
      correo.trim().toLowerCase(),
      codigo.trim(),
      nuevaContrasena,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};
