const califService = require("../services/calificacion.service");

exports.calificar = async (req, res, next) => {
  try {
    res
      .status(201)
      .json(
        await califService.calificar(
          req.usuario.id,
          req.body.viajeId,
          req.body.evaluadoId,
          req.body.puntuacion,
        ),
      );
  } catch (e) {
    next(e);
  }
};
exports.editarCalificacion = async (req, res, next) => {
  try {
    res.json(
      await califService.editarCalificacion(
        req.params.id,
        req.usuario.id,
        req.body.puntuacion,
      ),
    );
  } catch (e) {
    next(e);
  }
};
exports.resenar = async (req, res, next) => {
  try {
    res
      .status(201)
      .json(
        await califService.resenar(
          req.usuario.id,
          req.body.viajeId,
          req.body.destinoId,
          req.body.comentario,
        ),
      );
  } catch (e) {
    next(e);
  }
};
exports.editarResena = async (req, res, next) => {
  try {
    res.json(
      await califService.editarResena(
        req.params.id,
        req.usuario.id,
        req.body.comentario,
      ),
    );
  } catch (e) {
    next(e);
  }
};
exports.reputacion = async (req, res, next) => {
  try {
    res.json(await califService.obtenerReputacion(req.params.usuarioId));
  } catch (e) {
    next(e);
  }
};
exports.pendientes = async (req, res, next) => {
  try {
    res.json(await califService.pendientesDeCalificar(req.usuario.id));
  } catch (e) {
    next(e);
  }
};
