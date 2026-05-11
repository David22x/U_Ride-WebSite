const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Solicitud = sequelize.define('Solicitud', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  viajeId:    { type: DataTypes.UUID, allowNull: false },
  pasajeroId: { type: DataTypes.UUID, allowNull: false },
  estado:     { type: DataTypes.ENUM('pendiente','aceptada','rechazada','cancelada'), defaultValue: 'pendiente' },
  fechaEnvio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'solicitudes' });

module.exports = Solicitud;
