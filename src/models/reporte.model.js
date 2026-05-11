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
    reportanteId: { type: DataTypes.UUID, allowNull: false },
    reportadoId: { type: DataTypes.UUID, allowNull: false },
    viajeId: { type: DataTypes.UUID, allowNull: false },
    motivo: { type: DataTypes.TEXT, allowNull: false },
    evidencia: { type: DataTypes.STRING(255), allowNull: true },
    estado: {
      type: DataTypes.ENUM("pendiente", "revisado", "cerrado"),
      defaultValue: "pendiente",
    },
  },
  { tableName: "reportes" },
);
