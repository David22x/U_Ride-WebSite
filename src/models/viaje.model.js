const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Viaje = sequelize.define(
  "Viaje",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conductor_id: { type: DataTypes.UUID, allowNull: false },
    origen: { type: DataTypes.STRING(150), allowNull: false },
    destino: { type: DataTypes.STRING(150), allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    hora_salida: { type: DataTypes.TIME, allowNull: false },
    hora_llegada: { type: DataTypes.TIME, allowNull: false },
    cupos_total: { type: DataTypes.INTEGER, allowNull: false },
    cupos_disponibles: { type: DataTypes.INTEGER, allowNull: false },
    estado: {
      type: DataTypes.ENUM("publicado", "en_curso", "finalizado", "cancelado"),
      defaultValue: "publicado",
    },
    notas: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "viajes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Viaje;
