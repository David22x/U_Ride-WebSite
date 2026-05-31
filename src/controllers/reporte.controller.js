const reporteService = require("../services/reporte.service");

exports.crearReporte = async (req, res, next) => {
  try {
    res
      .status(201)
      .json(await reporteService.crearReporte(req.usuario.id, req.body));
  } catch (e) {
    next(e);
  }
};
exports.editarReporte = async (req, res, next) => {
  try {
    res.json(
      await reporteService.editarReporte(
        req.params.id,
        req.usuario.id,
        req.body,
      ),
    );
  } catch (e) {
    next(e);
  }
};
exports.eliminarReporte = async (req, res, next) => {
  try {
    res.json(
      await reporteService.eliminarReporte(req.params.id, req.usuario.id),
    );
  } catch (e) {
    next(e);
  }
};
exports.misReportes = async (req, res, next) => {
  try {
    res.json(await reporteService.misReportes(req.usuario.id));
  } catch (e) {
    next(e);
  }
};
