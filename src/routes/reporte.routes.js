const { Router } = require("express");
const rRouter = Router();
const rc = require("../controllers/reporte.controller");
const { autenticar } = require("../middlewares/auth.middleware");

rRouter.use(autenticar);

rRouter.get("/", rc.misReportes); // RF10
rRouter.post("/", rc.crearReporte); // RF10
rRouter.patch("/:id", rc.editarReporte); // RF10
rRouter.delete("/:id", rc.eliminarReporte); // RF10

module.exports = rRouter;
