const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

module.exports = sequelize.define(
  "AccionAdministrativa",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    adminId: { type: DataTypes.UUID, allowNull: false },
    estudianteId: { type: DataTypes.UUID, allowNull: false },
    reporteId: { type: DataTypes.UUID, allowNull: true },
    tipo: {
      type: DataTypes.ENUM("advertencia", "suspension"),
      allowNull: false,
    },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    duracionDias: { type: DataTypes.INTEGER, allowNull: true },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "acciones_administrativas" },
);
