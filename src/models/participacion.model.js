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
    viaje_id: { type: DataTypes.UUID, allowNull: false },
    pasajero_id: { type: DataTypes.UUID, allowNull: false },
    estado: {
      type: DataTypes.ENUM("confirmado", "cancelado"),
      defaultValue: "confirmado",
    },
    fecha_confirmacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    asistencia_pasajero: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "participaciones",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
