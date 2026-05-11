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
    usuarioId: { type: DataTypes.UUID, allowNull: false },
    codigo: { type: DataTypes.STRING(6), allowNull: false },
    expira: { type: DataTypes.DATE, allowNull: false },
  },
  { tableName: "verificaciones_correo" },
);
