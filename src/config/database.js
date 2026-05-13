const { Sequelize } = require("sequelize");
const logger = require("../utils/logger");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

async function connectDB() {
  try {
    await sequelize.authenticate();

    console.log("Conexión establecida correctamente");

    logger.info("Base de datos conectada correctamente");
  } catch (error) {
    console.error("Error conectando la base de datos:", error);
  }
}

module.exports = { sequelize, connectDB };
