const { Router } = require("express");
const router = Router();

router.use("/auth", require("./auth.routes"));
router.use("/usuarios", require("./usuario.routes"));
router.use("/viajes", require("./viaje.routes"));
router.use("/solicitudes", require("./solicitud.routes"));
router.use("/calificaciones", require("./calificacion.routes"));
router.use("/reportes", require("./reporte.routes"));
router.use("/admin", require("./admin.routes"));

module.exports = router;
