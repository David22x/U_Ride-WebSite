const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

module.exports = sequelize.define(
  "Reporte",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reportante_id: { type: DataTypes.UUID, allowNull: false },
    reportado_id: { type: DataTypes.UUID, allowNull: false },
    viaje_id: { type: DataTypes.UUID, allowNull: false },
    motivo: { type: DataTypes.TEXT, allowNull: false },
    evidencia: { type: DataTypes.STRING(255), allowNull: true },
    estado: {
      type: DataTypes.ENUM("pendiente", "revisado", "cerrado"),
      defaultValue: "pendiente",
    },
  },
  {
    tableName: "reportes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
