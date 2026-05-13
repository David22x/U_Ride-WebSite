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
    evaluador_id: { type: DataTypes.UUID, allowNull: false },
    evaluado_id: { type: DataTypes.UUID, allowNull: false },
    viaje_id: { type: DataTypes.UUID, allowNull: false },
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
