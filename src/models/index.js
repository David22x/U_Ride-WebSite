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

// ── Relaciones ────────────────────────────────────────

Usuario.hasOne(Conductor, {
  foreignKey: "usuario_id",
  as: "conductor",
});

Usuario.hasOne(Pasajero, {
  foreignKey: "usuario_id",
  as: "pasajero",
});

Conductor.belongsTo(Usuario, {
  foreignKey: "usuario_id",
});

Pasajero.belongsTo(Usuario, {
  foreignKey: "usuario_id",
});

Conductor.hasMany(Viaje, {
  foreignKey: "conductor_id",
  as: "viajes",
});

Viaje.belongsTo(Conductor, {
  foreignKey: "conductor_id",
  as: "conductor",
});

Viaje.hasOne(ReglasViaje, {
  foreignKey: "viaje_id",
  as: "reglas",
});

Viaje.hasMany(Solicitud, {
  foreignKey: "viaje_id",
  as: "solicitudes",
});

Viaje.hasMany(Participacion, {
  foreignKey: "viaje_id",
  as: "participantes",
});

Pasajero.hasMany(Solicitud, {
  foreignKey: "pasajero_id",
  as: "solicitudes",
});

Solicitud.belongsTo(Pasajero, {
  foreignKey: "pasajero_id",
  as: "pasajero",
});

Solicitud.belongsTo(Viaje, {
  foreignKey: "viaje_id",
  as: "viaje",
});

Usuario.hasMany(Calificacion, {
  foreignKey: "evaluador_id",
  as: "calificacionesHechas",
});

Usuario.hasMany(Calificacion, {
  foreignKey: "evaluado_id",
  as: "calificacionesRecibidas",
});

Usuario.hasMany(Resena, {
  foreignKey: "autor_id",
  as: "resenasHechas",
});

Usuario.hasMany(Reporte, {
  foreignKey: "reportante_id",
  as: "reportes",
});

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
