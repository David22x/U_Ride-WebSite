const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const RegistroPendiente = sequelize.define(
  "RegistroPendiente",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    correo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contrasenaHash: {
      type: DataTypes.STRING,
      field: "contrasena_hash",
      allowNull: false,
    },
    carrera: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    zona: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    codigo: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    expiraEn: {
      type: DataTypes.DATE,
      field: "expira_en",
      allowNull: false,
    },
    usado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "registros_pendientes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = RegistroPendiente;
