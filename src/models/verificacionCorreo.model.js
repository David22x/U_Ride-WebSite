const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

module.exports = sequelize.define(
  "VerificacionCorreo",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuario_id: { type: DataTypes.UUID, allowNull: false },
    codigo: { type: DataTypes.STRING(6), allowNull: false },
    expira_en: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: "verificaciones_correo",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);
