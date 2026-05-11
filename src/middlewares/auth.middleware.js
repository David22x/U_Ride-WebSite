const { verifyToken } = require("../config/jwt");
const { Usuario } = require("../models");

exports.autenticar = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No autenticado." });
    const payload = verifyToken(token);
    const usuario = await Usuario.findByPk(payload.id, {
      attributes: { exclude: ["contrasena"] },
    });
    if (!usuario || usuario.estado === "suspendido")
      return res.status(401).json({ error: "Acceso denegado." });
    req.usuario = usuario;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido." });
  }
};

exports.esConductor = (req, res, next) => {
  // Un estudiante puede actuar como conductor si tiene el perfil
  if (req.body.modoConductor || req.query.modo === "conductor") return next();
  next(); // simplificado — ajustar según lógica de negocio
};

exports.esAdmin = (req, res, next) => {
  if (req.usuario?.rol !== "administrador")
    return res.status(403).json({ error: "Sin permiso." });
  next();
};
