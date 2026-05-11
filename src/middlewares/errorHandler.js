const logger = require("../utils/logger");

exports.errorHandler = (err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });
  const status = err.status || 500;
  res
    .status(status)
    .json({ error: err.message || "Error interno del servidor." });
};
