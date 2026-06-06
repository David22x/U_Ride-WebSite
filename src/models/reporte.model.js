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
    reportanteId: {
      type: DataTypes.UUID,
      field: "reportante_id",
      allowNull: false,
    },
    reportadoId: {
      type: DataTypes.UUID,
      field: "reportado_id",
      allowNull: false,
    },
    viajeId: {
      type: DataTypes.UUID,
      field: "viaje_id",
      allowNull: false,
    },
    motivo: { type: DataTypes.TEXT, allowNull: false },
    evidencia: { type: DataTypes.STRING(255), allowNull: true },
    estado: {
      type: DataTypes.ENUM("pendiente", "revisado", "cerrado", "resuelto"),
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
