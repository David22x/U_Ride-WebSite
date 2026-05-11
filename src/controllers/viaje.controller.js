const viajeService = require("../services/viaje.service");

exports.listar = async (req, res, next) => {
  try {
    const viajes = await viajeService.buscar(req.query);
    res.json(viajes);
  } catch (err) {
    next(err);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const viaje = await viajeService.crear(req.usuario.id, req.body);
    res.status(201).json(viaje);
  } catch (err) {
    next(err);
  }
};

exports.obtener = async (req, res, next) => {
  try {
    const viaje = await viajeService.obtenerPorId(req.params.id);
    res.json(viaje);
  } catch (err) {
    next(err);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const viaje = await viajeService.actualizar(
      req.params.id,
      req.usuario.id,
      req.body,
    );
    res.json(viaje);
  } catch (err) {
    next(err);
  }
};

exports.cancelar = async (req, res, next) => {
  try {
    await viajeService.cancelar(req.params.id, req.usuario.id);
    res.json({ mensaje: "Viaje cancelado." });
  } catch (err) {
    next(err);
  }
};
