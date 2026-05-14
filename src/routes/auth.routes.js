const { Router } = require("express");
const router = Router();

const c = require("../controllers/auth.controller");
const { body } = require("express-validator");

const {
  loginLimiter,
  registroLimiter,
} = require("../middlewares/rateLimit.middleware");

/* ============================================================
   Validaciones registro
   ============================================================ */
const validateRegistro = [
  body("nombre").trim().notEmpty().withMessage("El nombre es requerido."),

  body("apellido").trim().notEmpty().withMessage("El apellido es requerido."),

  body("correo")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Correo inválido.")
    .custom((v) => {
      const domain = process.env.INSTITUTIONAL_DOMAIN || "uta.edu.ec";

      if (!v.endsWith(`@${domain}`)) {
        throw new Error(`Solo se permiten correos @${domain}`);
      }

      return true;
    }),

  body("contrasena")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener mínimo 8 caracteres."),
];

/* ============================================================
   Validaciones login
   ============================================================ */
const validateLogin = [
  body("correo").trim().isEmail().withMessage("Correo inválido."),

  body("contrasena").notEmpty().withMessage("La contraseña es requerida."),
];

/* ============================================================
   Rutas auth
   ============================================================ */
router.post("/registro", registroLimiter, validateRegistro, c.registro);

router.post("/verificar-codigo", c.verificarCodigo);

router.post("/reenviar-codigo", registroLimiter, c.reenviarCodigo);

router.post("/login", loginLimiter, validateLogin, c.login);

router.post("/logout", c.logout);

router.post("/recuperar-contrasena", registroLimiter, c.recuperarContrasena);

router.post("/verificar-codigo-recuperacion", c.verificarCodigoRecuperacion);

router.post("/cambiar-contrasena", c.cambiarContrasena);

module.exports = router;
