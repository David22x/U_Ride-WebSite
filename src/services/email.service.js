const transporter = require("../config/mailer");

exports.enviarCodigo = (correo, nombre, codigo) =>
  transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: correo,
    subject: "U-Ride — Verifica tu cuenta",
    html: `<h2>Hola ${nombre}</h2><p>Tu código de verificación es: <strong>${codigo}</strong></p><p>Expira en ${process.env.CODE_EXPIRES_MINUTES} minutos.</p>`,
  });

exports.enviarRecuperacion = (correo, nombre, codigo) =>
  transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: correo,
    subject: "U-Ride — Recupera tu contraseña",
    html: `<h2>Hola ${nombre}</h2><p>Tu código de recuperación es: <strong>${codigo}</strong></p><p>Expira en 15 minutos.</p>`,
  });

exports.notificarSolicitudAceptada = (correo, nombre, viaje) =>
  transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: correo,
    subject: "U-Ride — ¡Tu solicitud fue aceptada!",
    html: `<h2>Hola ${nombre}</h2><p>Tu solicitud para el viaje <strong>${viaje.origen} → ${viaje.destino}</strong> fue aceptada.</p>`,
  });
