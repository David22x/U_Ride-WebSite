const { Router } = require("express");
const router = Router();

const conductorController = require("../controllers/conductor.controller");
const { autenticar } = require("../middlewares/auth.middleware");

router.get("/:usuarioId", autenticar, conductorController.obtener);

router.post("/:usuarioId", autenticar, conductorController.guardar);

module.exports = router;
