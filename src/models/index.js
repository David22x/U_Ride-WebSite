const { sequelize } = require('../config/database');

const Usuario            = require('./usuario.model');
const VerificacionCorreo = require('./verificacionCorreo.model');
const Conductor          = require('./conductor.model');
const Pasajero           = require('./pasajero.model');
const Viaje              = require('./viaje.model');
const ReglasViaje        = require('./reglasViaje.model');
const Solicitud          = require('./solicitud.model');
const Participacion      = require('./participacion.model');
const Calificacion       = require('./calificacion.model');
const Resena             = require('./resena.model');
const Reporte            = require('./reporte.model');
const AccionAdministrativa = require('./accionAdministrativa.model');

// ── Relaciones ────────────────────────────────────────
Usuario.hasOne(Conductor,   { foreignKey: 'usuarioId', as: 'conductor' });
Usuario.hasOne(Pasajero,    { foreignKey: 'usuarioId', as: 'pasajero' });
Conductor.belongsTo(Usuario, { foreignKey: 'usuarioId' });
Pasajero.belongsTo(Usuario,  { foreignKey: 'usuarioId' });

Conductor.hasMany(Viaje,    { foreignKey: 'conductorId', as: 'viajes' });
Viaje.belongsTo(Conductor,  { foreignKey: 'conductorId', as: 'conductor' });
Viaje.hasOne(ReglasViaje,   { foreignKey: 'viajeId',    as: 'reglas' });
Viaje.hasMany(Solicitud,    { foreignKey: 'viajeId',    as: 'solicitudes' });
Viaje.hasMany(Participacion,{ foreignKey: 'viajeId',    as: 'participantes' });

Pasajero.hasMany(Solicitud, { foreignKey: 'pasajeroId', as: 'solicitudes' });
Solicitud.belongsTo(Pasajero,{ foreignKey: 'pasajeroId', as: 'pasajero' });
Solicitud.belongsTo(Viaje,  { foreignKey: 'viajeId',    as: 'viaje' });

Usuario.hasMany(Calificacion,{ foreignKey: 'evaluadorId', as: 'calificacionesHechas' });
Usuario.hasMany(Calificacion,{ foreignKey: 'evaluadoId',  as: 'calificacionesRecibidas' });
Usuario.hasMany(Resena,      { foreignKey: 'autorId',     as: 'resenasHechas' });
Usuario.hasMany(Reporte,     { foreignKey: 'reportanteId',as: 'reportes' });

module.exports = {
  sequelize,
  Usuario, VerificacionCorreo,
  Conductor, Pasajero,
  Viaje, ReglasViaje, Solicitud, Participacion,
  Calificacion, Resena,
  Reporte, AccionAdministrativa,
};
