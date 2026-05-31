const { Router } = require("express");
const cRouter = Router();
const cc = require("../controllers/calificacion.controller");
const { autenticar } = require("../middlewares/auth.middleware");

cRouter.use(autenticar);

cRouter.get("/pendientes", cc.pendientes); // RF8
cRouter.post("/", cc.calificar); // RF8
cRouter.patch("/:id", cc.editarCalificacion); // RF8
cRouter.post("/resenas", cc.resenar); // RF8
cRouter.patch("/resenas/:id", cc.editarResena); // RF8
cRouter.get("/reputacion/:usuarioId", cc.reputacion); // RF8

module.exports = cRouter;
