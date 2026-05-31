const adminReporte = require("../services/reporte.service");

exports.listarReportes = async (req, res, next) => {
  try { res.json(await adminReporte.listarReportesAdmin(req.query)); } catch (e) { next(e); }
};
exports.obtenerReporte = async (req, res, next) => {
  try { res.json(await adminReporte.obtenerReporte(req.params.id)); } catch (e) { next(e); }
};
exports.resolverReporte = async (req, res, next) => {
  try {
    const { Reporte } = require("../models");
    const reporte = await Reporte.findByPk(req.params.id);
    if (!reporte) return res.status(404).json({ error: "Reporte no encontrado." });
    await reporte.update({ estado: "resuelto" });
    res.json({ mensaje: "Reporte marcado como resuelto." });
  } catch (e) { next(e); }
};
exports.advertir = async (req, res, next) => {
  try {
    res.json(await adminReporte.advertirEstudiante(req.usuario.id, req.body));
  } catch (e) { next(e); }
};
exports.suspender = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (!body.duracionDias) body.duracionDias = 7; // default 7 días
    if (!body.descripcion && body.mensaje) body.descripcion = body.mensaje;
    res.json(await adminReporte.suspenderEstudiante(req.usuario.id, body));
  } catch (e) { next(e); }
};
exports.levantarSuspension = async (req, res, next) => {
  try {
    res.json(await adminReporte.levantarSuspension(req.usuario.id, req.params.estudianteId));
  } catch (e) { next(e); }
};
exports.historial = async (req, res, next) => {
  try { res.json(await adminReporte.historialAcciones(req.params.estudianteId)); } catch (e) { next(e); }
};
exports.listarUsuarios = async (req, res, next) => {
  try {
    const { Usuario } = require("../models");
    const usuarios = await Usuario.findAll({
      attributes: ["id", "nombre", "apellido", "correo", "carrera", "zona", "estado", "rol"],
      order: [["nombre", "ASC"]],
    });
    // Mapear suspendido como booleano para el frontend
    res.json(usuarios.map(u => ({
      ...u.toJSON(),
      suspendido: u.estado === "suspendido",
    })));
  } catch (e) { next(e); }
};
