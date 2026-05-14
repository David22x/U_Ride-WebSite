const usuarioService = require("../services/usuario.service");

exports.obtenerStats = async (req, res, next) => {
  try {
    const stats = await usuarioService.obtenerStats(req.usuario.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const usuario = await usuarioService.actualizar(req.params.id, req.body);

    res.json(usuario);
  } catch (err) {
    next(err);
  }
};
