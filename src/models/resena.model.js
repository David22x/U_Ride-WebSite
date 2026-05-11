const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

module.exports = sequelize.define(
  "Resena",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    autorId: { type: DataTypes.UUID, allowNull: false },
    destinoId: { type: DataTypes.UUID, allowNull: false },
    viajeId: { type: DataTypes.UUID, allowNull: false },
    comentario: { type: DataTypes.TEXT, allowNull: false },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "resenas" },
);
