const logger = require("../utils/logger");

exports.errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;

  if (status >= 500) {
    console.error("ERROR COMPLETO:");
    console.error(err);

    logger.error(err.message, {
      stack: err.stack,
    });
  } else {
    console.warn(`${status}: ${err.message}`);
  }

  res.status(status).json({
    error: err.message || "Error interno del servidor.",
  });
};
