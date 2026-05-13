const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Solicitud = sequelize.define(
  "Solicitud",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    viaje_id: { type: DataTypes.UUID, allowNull: false },
    pasajero_id: { type: DataTypes.UUID, allowNull: false },
    estado: {
      type: DataTypes.ENUM("pendiente", "aceptada", "rechazada", "cancelada"),
      defaultValue: "pendiente",
    },
    fecha_envio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "solicitudes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Solicitud;
