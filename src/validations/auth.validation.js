const { body } = require("express-validator");

exports.validateRegistro = [
  body("nombre").trim().notEmpty().withMessage("El nombre es requerido."),
  body("apellido").trim().notEmpty().withMessage("El apellido es requerido."),
  body("correo")
    .isEmail()
    .withMessage("Correo inválido.")
    .custom((v) => v.endsWith(`@${process.env.INSTITUTIONAL_DOMAIN}`))
    .withMessage("Debes usar tu correo institucional."),
  body("contrasena")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres."),
];

exports.validateLogin = [
  body("correo").isEmail().withMessage("Correo inválido."),
  body("contrasena").notEmpty().withMessage("La contraseña es requerida."),
];
