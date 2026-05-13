const rateLimit = require("express-rate-limit");

/* ============================================================
   Login: máximo intentos por IP
   ============================================================ */
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error: "Demasiados intentos de inicio de sesión. Intenta en 15 minutos.",
  },
});

/* ============================================================
   Registro / reenvío OTP
   ============================================================ */
exports.registroLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error: "Demasiadas solicitudes de registro. Intenta más tarde.",
  },
});

/* ============================================================
   Límite general API
   ============================================================ */
exports.apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 120,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error: "Límite de peticiones alcanzado. Intenta en un momento.",
  },
});
