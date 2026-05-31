const { Router } = require("express");
const mainRouter = Router();

mainRouter.use("/auth", require("./auth.routes"));
mainRouter.use("/usuarios", require("./usuario.routes"));
mainRouter.use("/viajes", require("./viaje.routes"));
mainRouter.use("/calificaciones", require("./calificacion.routes"));
mainRouter.use("/reportes", require("./reporte.routes"));
mainRouter.use("/admin", require("./admin.routes"));
mainRouter.use("/conductores", require("./conductor.routes"));
mainRouter.use("/solicitudes", require("./solicitud.routes"));

module.exports = mainRouter;
