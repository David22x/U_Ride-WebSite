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
    adminId: {
      type: DataTypes.UUID,
      field: "admin_id",
      allowNull: false,
    },
    estudianteId: {
      type: DataTypes.UUID,
      field: "estudiante_id",
      allowNull: false,
    },
    reporteId: {
      type: DataTypes.UUID,
      field: "reporte_id",
      allowNull: true,
    },
    tipo: {
      type: DataTypes.ENUM("advertencia", "suspension"),
      allowNull: false,
    },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    duracionDias: {
      type: DataTypes.INTEGER,
      field: "duracion_dias",
      allowNull: true,
    },
    fechaFin: {
      type: DataTypes.DATE,
      field: "fecha_fin",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "acciones_administrativas",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);
