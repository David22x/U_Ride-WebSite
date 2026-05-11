const rateLimit = require("express-rate-limit");

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos. Intenta en 15 minutos." },
});

exports.apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Límite de peticiones alcanzado." },
});
