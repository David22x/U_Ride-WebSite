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
    usuarioId: {
      type: DataTypes.UUID,
      field: "usuario_id",
      allowNull: false,
    },
    codigo: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM("registro", "recuperacion"),
      allowNull: false,
      defaultValue: "registro",
    },
    usado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    expiraEn: {
      type: DataTypes.DATE,
      field: "expira_en",
      allowNull: false,
    },
  },
  {
    tableName: "verificaciones_correo",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);
