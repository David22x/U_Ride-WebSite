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

    conductorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "conductor_id",
    },

    origen: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    destino: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    /* ── Coordenadas seleccionadas en el mapa (NUEVO) ── */
    origenLat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      field: "origen_lat",
    },
    origenLng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      field: "origen_lng",
    },
    destinoLat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      field: "destino_lat",
    },
    destinoLng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      field: "destino_lng",
    },
    /* ──────────────────────────────────────────────── */

    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    horaSalida: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "hora_salida",
    },

    horaLlegada: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "hora_llegada",
    },

    cuposTotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "cupos_total",
    },

    cuposDisponibles: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "cupos_disponibles",
    },

    estado: {
      type: DataTypes.ENUM("publicado", "en_curso", "finalizado", "cancelado"),
      defaultValue: "publicado",
    },

    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "viajes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Viaje;
