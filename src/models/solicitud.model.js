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
    pasajeroId: {
      type: DataTypes.UUID,
      field: "pasajero_id",
      allowNull: false,
    },
    viajeId: {
      type: DataTypes.UUID,
      field: "viaje_id",
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "aceptada", "rechazada", "cancelada"),
      defaultValue: "pendiente",
    },
    fechaEnvio: {
      type: DataTypes.DATE,
      field: "fecha_envio",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "solicitudes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Solicitud;
