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
    autor_id: { type: DataTypes.UUID, allowNull: false },
    destino_id: { type: DataTypes.UUID, allowNull: false },
    viaje_id: { type: DataTypes.UUID, allowNull: false },
    comentario: { type: DataTypes.TEXT, allowNull: false },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "resenas",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
