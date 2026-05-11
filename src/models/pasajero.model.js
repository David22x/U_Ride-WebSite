const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

module.exports = sequelize.define(
  "Pasajero",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuarioId: { type: DataTypes.UUID, allowNull: false, unique: true },
  },
  { tableName: "pasajeros" },
);
