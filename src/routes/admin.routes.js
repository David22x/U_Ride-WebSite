const { Router } = require("express");
const aRouter = Router();
const ac = require("../controllers/admin.controller");
const { esAdmin, autenticar } = require("../middlewares/auth.middleware");

aRouter.use(autenticar, esAdmin);

aRouter.get("/reportes", ac.listarReportes);                      // RF11
aRouter.get("/reportes/:id", ac.obtenerReporte);                  // RF11
aRouter.patch("/reportes/:id/resolver", ac.resolverReporte);      // RF11 nuevo
aRouter.post("/advertir", ac.advertir);                           // RF11 (path simplificado)
aRouter.post("/suspender", ac.suspender);                         // RF11 (path simplificado)
aRouter.post("/levantar-suspension/:estudianteId", ac.levantarSuspension); // RF11
aRouter.get("/historial/:estudianteId", ac.historial);            // RF11
aRouter.get("/usuarios", ac.listarUsuarios);                      // nuevo

module.exports = aRouter;
