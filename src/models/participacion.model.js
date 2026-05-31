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
    viajeId: {
      type: DataTypes.UUID,
      field: "viaje_id",
      allowNull: false,
    },
    pasajeroId: {
      type: DataTypes.UUID,
      field: "pasajero_id",
      allowNull: false,
    },
    solicitudId: {
      type: DataTypes.UUID,
      field: "solicitud_id",
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("confirmado", "cancelado"),
      defaultValue: "confirmado",
    },
    fechaConfirmacion: {
      type: DataTypes.DATE,
      field: "fecha_confirmacion",
      defaultValue: DataTypes.NOW,
    },
    asistenciaPasajero: {
      type: DataTypes.BOOLEAN,
      field: "asistencia_pasajero",
      defaultValue: false,
    },
  },
  {
    tableName: "participaciones",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
