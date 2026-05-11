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
    evaluadorId: { type: DataTypes.UUID, allowNull: false },
    evaluadoId: { type: DataTypes.UUID, allowNull: false },
    viajeId: { type: DataTypes.UUID, allowNull: false },
    puntuacion: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
  },
  { tableName: "calificaciones" },
);

module.exports = Calificacion;
