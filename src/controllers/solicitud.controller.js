const solicitudService = require("../services/solicitud.service");

exports.crear = async (req, res, next) => {
  try {
    res
      .status(201)
      .json(await solicitudService.crear(req.usuario.id, req.body.viajeId));
  } catch (err) {
    next(err);
  }
};
exports.aceptar = async (req, res, next) => {
  try {
    res.json(await solicitudService.aceptar(req.params.id, req.usuario.id));
  } catch (err) {
    next(err);
  }
};
exports.rechazar = async (req, res, next) => {
  try {
    res.json(await solicitudService.rechazar(req.params.id, req.usuario.id));
  } catch (err) {
    next(err);
  }
};
