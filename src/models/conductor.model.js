const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

module.exports = sequelize.define(
  "Conductor",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuario_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    vehiculo: { type: DataTypes.STRING(100), allowNull: false },
    placa: { type: DataTypes.STRING(20), allowNull: false },
    color: { type: DataTypes.STRING(50), allowNull: false },
    licencia: { type: DataTypes.STRING(50), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "conductores",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
