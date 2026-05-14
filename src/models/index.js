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
  foreignKey: "usuario_id",
  as: "perfilConductor",
});

Conductor.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

/* Usuario ↔ Pasajero */
Usuario.hasOne(Pasajero, {
  foreignKey: "usuario_id",
  as: "perfilPasajero",
});

Pasajero.belongsTo(Usuario, {
  foreignKey: "usuario_id",
  as: "usuario",
});

/* Conductor ↔ Viaje */
Conductor.hasMany(Viaje, {
  foreignKey: "conductor_id",
  as: "viajes",
});

Viaje.belongsTo(Conductor, {
  foreignKey: "conductor_id",
  as: "conductor",
});

/* Viaje ↔ Reglas */
Viaje.hasOne(ReglasViaje, {
  foreignKey: "viaje_id",
  as: "reglas",
});

ReglasViaje.belongsTo(Viaje, {
  foreignKey: "viaje_id",
  as: "viaje",
});

/* Viaje ↔ Solicitudes */
Viaje.hasMany(Solicitud, {
  foreignKey: "viaje_id",
  as: "solicitudes",
});

Solicitud.belongsTo(Viaje, {
  foreignKey: "viaje_id",
  as: "viaje",
});

/* Pasajero ↔ Solicitudes */
Pasajero.hasMany(Solicitud, {
  foreignKey: "pasajero_id",
  as: "solicitudes",
});

Solicitud.belongsTo(Pasajero, {
  foreignKey: "pasajero_id",
  as: "pasajero",
});

/* Viaje ↔ Participaciones */
Viaje.hasMany(Participacion, {
  foreignKey: "viaje_id",
  as: "participantes",
});

Participacion.belongsTo(Viaje, {
  foreignKey: "viaje_id",
  as: "viaje",
});

/* Usuario ↔ Calificaciones */
Usuario.hasMany(Calificacion, {
  foreignKey: "evaluador_id",
  as: "calificacionesHechas",
});

Usuario.hasMany(Calificacion, {
  foreignKey: "evaluado_id",
  as: "calificacionesRecibidas",
});

Calificacion.belongsTo(Usuario, {
  foreignKey: "evaluador_id",
  as: "evaluador",
});

Calificacion.belongsTo(Usuario, {
  foreignKey: "evaluado_id",
  as: "evaluado",
});

/* Usuario ↔ Reseñas */
Usuario.hasMany(Resena, {
  foreignKey: "autor_id",
  as: "resenasHechas",
});

Resena.belongsTo(Usuario, {
  foreignKey: "autor_id",
  as: "autor",
});

/* Usuario ↔ Reportes */
Usuario.hasMany(Reporte, {
  foreignKey: "reportante_id",
  as: "reportesHechos",
});

Reporte.belongsTo(Usuario, {
  foreignKey: "reportante_id",
  as: "reportante",
});

/* Usuario ↔ Verificaciones */
Usuario.hasMany(VerificacionCorreo, {
  foreignKey: "usuario_id",
  as: "verificaciones",
});

VerificacionCorreo.belongsTo(Usuario, {
  foreignKey: "usuario_id",
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
