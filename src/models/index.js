const { sequelize } = require("../config/database");

const Usuario = require("./usuario.model");
const VerificacionCorreo = require("./verificacionCorreo.model");
const Conductor = require("./conductor.model");
const Pasajero = require("./pasajero.model");
const Viaje = require("./viaje.model");
const ReglasViaje = require("./reglasViaje.model");
const Solicitud = require("./solicitud.model");
const Participacion = require("./participacion.model");
const Calificacion = require("./calificacion.model");
const Resena = require("./resena.model");
const Reporte = require("./reporte.model");
const AccionAdministrativa = require("./accionAdministrativa.model");
const RegistroPendiente = require("./registroPendiente.model");

/* ── Relaciones ───────────────────────────────────── */

/* Usuario ↔ Conductor */
Usuario.hasOne(Conductor, {
  foreignKey: "usuarioId",
  as: "perfilConductor",
});

Conductor.belongsTo(Usuario, {
  foreignKey: "usuarioId",
  as: "usuario",
});

/* Usuario ↔ Pasajero */
Usuario.hasOne(Pasajero, {
  foreignKey: "usuarioId",
  as: "perfilPasajero",
});

Pasajero.belongsTo(Usuario, {
  foreignKey: "usuarioId",
  as: "usuario",
});

/* Conductor ↔ Viaje */
Conductor.hasMany(Viaje, {
  foreignKey: "conductorId",
  as: "viajes",
});

Viaje.belongsTo(Conductor, {
  foreignKey: "conductorId",
  as: "conductor",
});

/* Viaje ↔ Reglas */
Viaje.hasOne(ReglasViaje, {
  foreignKey: "viajeId",
  as: "reglas",
});

ReglasViaje.belongsTo(Viaje, {
  foreignKey: "viajeId",
  as: "viaje",
});

/* Viaje ↔ Solicitudes */
Viaje.hasMany(Solicitud, {
  foreignKey: "viajeId",
  as: "solicitudes",
});

Solicitud.belongsTo(Viaje, {
  foreignKey: "viajeId",
  as: "viaje",
});

/* Pasajero ↔ Solicitudes */
Pasajero.hasMany(Solicitud, {
  foreignKey: "pasajeroId",
  as: "solicitudes",
});

Solicitud.belongsTo(Pasajero, {
  foreignKey: "pasajeroId",
  as: "pasajero",
});

/* Viaje ↔ Participaciones */
Viaje.hasMany(Participacion, {
  foreignKey: "viajeId",
  as: "participantes",
});

Participacion.belongsTo(Viaje, {
  foreignKey: "viajeId",
  as: "viaje",
});

/* Pasajero ↔ Participaciones */
Pasajero.hasMany(Participacion, {
  foreignKey: "pasajeroId",
  as: "participaciones",
});

Participacion.belongsTo(Pasajero, {
  foreignKey: "pasajeroId",
  as: "pasajero",
});

/* Usuario ↔ Calificaciones */
Usuario.hasMany(Calificacion, {
  foreignKey: "evaluadorId",
  as: "calificacionesHechas",
});

Usuario.hasMany(Calificacion, {
  foreignKey: "evaluadoId",
  as: "calificacionesRecibidas",
});

Calificacion.belongsTo(Usuario, {
  foreignKey: "evaluadorId",
  as: "evaluador",
});

Calificacion.belongsTo(Usuario, {
  foreignKey: "evaluadoId",
  as: "evaluado",
});

/* Usuario ↔ Reseñas */
Usuario.hasMany(Resena, {
  foreignKey: "autorId",
  as: "resenasHechas",
});

Resena.belongsTo(Usuario, {
  foreignKey: "autorId",
  as: "autor",
});

/* Usuario ↔ Reportes */
Usuario.hasMany(Reporte, {
  foreignKey: "reportanteId",
  as: "reportesHechos",
});

Reporte.belongsTo(Usuario, {
  foreignKey: "reportanteId",
  as: "reportante",
});

/* Reporte ↔ AccionAdministrativa */
Reporte.hasMany(AccionAdministrativa, { foreignKey: "reporteId", as: "acciones" });
AccionAdministrativa.belongsTo(Reporte, { foreignKey: "reporteId", as: "reporte" });

/* AccionAdministrativa ↔ Usuario (admin) */
Usuario.hasMany(AccionAdministrativa, { foreignKey: "adminId", as: "accionesHechas" });
AccionAdministrativa.belongsTo(Usuario, { foreignKey: "adminId", as: "admin" });

/* Usuario ↔ Verificaciones */
Usuario.hasMany(VerificacionCorreo, {
  foreignKey: "usuarioId",
  as: "verificaciones",
});

VerificacionCorreo.belongsTo(Usuario, {
  foreignKey: "usuarioId",
  as: "usuario",
});

/* ── Exportar modelos ───────────────────────────────── */

module.exports = {
  sequelize,
  Usuario,
  VerificacionCorreo,
  Conductor,
  Pasajero,
  Viaje,
  ReglasViaje,
  Solicitud,
  Participacion,
  Calificacion,
  Resena,
  Reporte,
  AccionAdministrativa,
  RegistroPendiente,
};
