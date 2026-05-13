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
    admin_id: { type: DataTypes.UUID, allowNull: false },
    estudiante_id: { type: DataTypes.UUID, allowNull: false },
    reporte_id: { type: DataTypes.UUID, allowNull: true },
    tipo: {
      type: DataTypes.ENUM("advertencia", "suspension"),
      allowNull: false,
    },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    duracion_dias: { type: DataTypes.INTEGER, allowNull: true },
    fecha_fin: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "acciones_administrativas",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);
