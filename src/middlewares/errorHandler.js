const logger = require("../utils/logger");

exports.errorHandler = (err, _req, res, _next) => {
  console.log("ERROR COMPLETO:");
  console.log(err);

  logger.error(err.message, { stack: err.stack });

  const status = err.status || 500;

  res.status(status).json({
    error: err.message || "Error interno del servidor.",
  });
};
