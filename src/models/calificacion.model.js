const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Calificacion = sequelize.define(
  "Calificacion",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    evaluadorId: {
      type: DataTypes.UUID,
      field: "evaluador_id",
      allowNull: false,
    },
    evaluadoId: {
      type: DataTypes.UUID,
      field: "evaluado_id",
      allowNull: false,
    },
    viajeId: {
      type: DataTypes.UUID,
      field: "viaje_id",
      allowNull: false,
    },
    puntuacion: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
  },
  {
    tableName: "calificaciones",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Calificacion;
