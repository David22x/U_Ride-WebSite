const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

module.exports = sequelize.define(
  "ReglasViaje",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    viajeId: { type: DataTypes.UUID, allowNull: false, unique: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    obligatoria: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "reglas_viaje" },
);
