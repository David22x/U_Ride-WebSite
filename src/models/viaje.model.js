const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Viaje = sequelize.define('Viaje', {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  conductorId:     { type: DataTypes.UUID, allowNull: false },
  origen:          { type: DataTypes.STRING(150), allowNull: false },
  destino:         { type: DataTypes.STRING(150), allowNull: false },
  fecha:           { type: DataTypes.DATEONLY, allowNull: false },
  horaSalida:      { type: DataTypes.TIME, allowNull: false },
  horaLlegada:     { type: DataTypes.TIME, allowNull: false },
  cuposTotal:      { type: DataTypes.INTEGER, allowNull: false },
  cuposDisponibles:{ type: DataTypes.INTEGER, allowNull: false },
  estado:          { type: DataTypes.ENUM('publicado','en_curso','finalizado','cancelado'), defaultValue: 'publicado' },
  notas:           { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'viajes' });

module.exports = Viaje;
