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
    viaje_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    obligatoria: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "reglas_viaje",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);
