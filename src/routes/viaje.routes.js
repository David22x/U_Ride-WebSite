const { Router } = require("express");
const router = Router();
const viajeController = require("../controllers/viaje.controller");
const { autenticar, esConductor } = require("../middlewares/auth.middleware");

router.get("/", autenticar, viajeController.listar);
router.post("/", autenticar, esConductor, viajeController.crear);
router.get("/:id", autenticar, viajeController.obtener);
router.put("/:id", autenticar, esConductor, viajeController.actualizar);
router.delete("/:id", autenticar, esConductor, viajeController.cancelar);

module.exports = router;
