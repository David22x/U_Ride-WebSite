const { Router } = require("express");
const vRouter = Router();
const vc = require("../controllers/viaje.controller");
const { autenticar } = require("../middlewares/auth.middleware");

vRouter.use(autenticar);

// Viajes
vRouter.get("/", vc.buscarViajes); // RF4
vRouter.post("/", vc.crearViaje); // RF3
vRouter.get("/mis-viajes", vc.misViajes); // RF3
vRouter.get("/:id", vc.obtenerViaje); // RF3 + RF9 (incluye reglas)
vRouter.patch("/:id", vc.modificarViaje); // RF3
vRouter.delete("/:id", vc.cancelarViaje); // RF3
vRouter.patch("/:id/finalizar", vc.finalizarViaje);
vRouter.patch("/:id/iniciar", vc.iniciarViaje);

// Solicitudes
vRouter.get("/solicitudes/pendientes", vc.solicitudesPend); // RF6
vRouter.post("/solicitudes", vc.enviarSolicitud); // RF5
vRouter.patch("/solicitudes/:id/cancelar", vc.cancelarSolicitud); // RF5
vRouter.patch("/solicitudes/:id/aceptar", vc.aceptarSolicitud); // RF6 + RF7
vRouter.patch("/solicitudes/:id/rechazar", vc.rechazarSolicitud); // RF6

module.exports = vRouter;
