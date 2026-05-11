const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

module.exports = sequelize.define(
  "Participacion",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    viajeId: { type: DataTypes.UUID, allowNull: false },
    pasajeroId: { type: DataTypes.UUID, allowNull: false },
    estado: {
      type: DataTypes.ENUM("confirmado", "cancelado"),
      defaultValue: "confirmado",
    },
    fechaConfirmacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    asistenciaPasajero: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "participaciones" },
);
