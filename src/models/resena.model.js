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
    autorId: {
      type: DataTypes.UUID,
      field: "autor_id",
      allowNull: false,
    },
    destinoId: {
      type: DataTypes.UUID,
      field: "destino_id",
      allowNull: false,
    },
    viajeId: {
      type: DataTypes.UUID,
      field: "viaje_id",
      allowNull: false,
    },
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
