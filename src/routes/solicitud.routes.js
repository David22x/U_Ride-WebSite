const { Router } = require("express");
const router = Router();
const c = require("../controllers/solicitud.controller");
const { autenticar } = require("../middlewares/auth.middleware");

router.post("/", autenticar, c.crear);
router.patch("/:id/aceptar", autenticar, c.aceptar);
router.patch("/:id/rechazar", autenticar, c.rechazar);

module.exports = router;
