const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcryptjs");

const Usuario = sequelize.define(
  "Usuario",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    apellido: { type: DataTypes.STRING(100), allowNull: false },
    correo: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    contrasena: { type: DataTypes.STRING(255), allowNull: false },
    foto: { type: DataTypes.STRING(255), allowNull: true },
    carrera: { type: DataTypes.STRING(100), allowNull: true },
    zona: { type: DataTypes.STRING(100), allowNull: true },
    telefono: { type: DataTypes.STRING(20), allowNull: true },
    rol: {
      type: DataTypes.ENUM("estudiante", "administrador"),
      defaultValue: "estudiante",
    },
    estado: {
      type: DataTypes.ENUM("activo", "suspendido", "inactivo"),
      defaultValue: "activo",
    },
    verificado: { type: DataTypes.BOOLEAN, defaultValue: false },
    advertencias: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "usuarios",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    hooks: {
      beforeCreate: async (u) => {
        u.contrasena = await bcrypt.hash(u.contrasena, 12);
      },
      beforeUpdate: async (u) => {
        if (u.changed("contrasena"))
          u.contrasena = await bcrypt.hash(u.contrasena, 12);
      },
    },
  },
);

Usuario.prototype.verificarContrasena = function (plain) {
  return bcrypt.compare(plain, this.contrasena);
};

module.exports = Usuario;
