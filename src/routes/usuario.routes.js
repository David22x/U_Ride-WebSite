const { Router } = require("express");
const router = Router();

const usuarioController = require("../controllers/usuario.controller");
const { autenticar } = require("../middlewares/auth.middleware");

router.get("/stats", autenticar, usuarioController.obtenerStats);

router.patch("/:id", autenticar, usuarioController.actualizar);

module.exports = router;
