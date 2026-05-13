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

    contrasena_hash: {
      type: DataTypes.STRING,
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

    expira_en: {
      type: DataTypes.DATE,
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
