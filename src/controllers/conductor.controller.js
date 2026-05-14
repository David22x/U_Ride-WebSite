const conductorService = require("../services/conductor.service");

exports.obtener = async (req, res, next) => {
  try {
    const data = await conductorService.obtenerPorUsuario(req.params.usuarioId);

    if (!data) {
      return res.status(404).json({
        error: "Perfil de conductor no encontrado",
      });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.guardar = async (req, res, next) => {
  try {
    const data = await conductorService.guardar(req.params.usuarioId, req.body);

    res.json(data);
  } catch (err) {
    next(err);
  }
};
