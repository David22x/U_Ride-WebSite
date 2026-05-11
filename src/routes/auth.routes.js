const { Router } = require("express");
const router = Router();
const authController = require("../controllers/auth.controller");
const {
  validateRegistro,
  validateLogin,
} = require("../validations/auth.validation");

router.post("/registro", validateRegistro, authController.registro);
router.post("/verificar-codigo", authController.verificarCodigo);
router.post("/login", validateLogin, authController.login);
router.post("/logout", authController.logout);
router.post("/recuperar-contrasena", authController.recuperarContrasena);
router.post("/cambiar-contrasena", authController.cambiarContrasena);

module.exports = router;
