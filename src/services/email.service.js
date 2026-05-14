const transporter = require("../config/mailer");

const FROM = process.env.MAIL_FROM || '"U-Ride UTA" <uride@uta.edu.ec>';

/* ── Plantilla base ────────────────────────────────────── */
function plantillaBase(contenido) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin:0; padding:0; background:#F1F5F9; font-family:'Segoe UI',sans-serif; }
    .wrap { max-width:560px; margin:32px auto; }
    .card { background:#fff; border-radius:16px; overflow:hidden;
            box-shadow:0 4px 20px rgba(0,0,0,.08); }
    .header { background:#1D4ED8; padding:28px 32px; }
    .header-logo { color:#fff; font-size:1.4rem; font-weight:700;
                   letter-spacing:-.5px; margin:0; }
    .body { padding:32px; color:#1E293B; }
    h2 { font-size:1.25rem; margin:0 0 8px; color:#0F172A; }
    p  { font-size:.95rem; line-height:1.6; color:#475569; margin:0 0 16px; }
    .code-box { background:#EFF6FF; border:2px dashed #BFDBFE; border-radius:12px;
                text-align:center; padding:20px 16px; margin:24px 0; }
    .code { font-size:2.4rem; font-weight:700; letter-spacing:12px;
            color:#1D4ED8; font-family:'Courier New',monospace; }
    .expires { font-size:.8rem; color:#94A3B8; margin:6px 0 0; }
    .note { font-size:.82rem; color:#94A3B8; background:#F8FAFC;
            border-left:3px solid #CBD5E1; padding:10px 14px; border-radius:4px; }
    .footer { background:#F8FAFC; padding:20px 32px;
              border-top:1px solid #E2E8F0; text-align:center; }
    .footer p { font-size:.8rem; color:#94A3B8; margin:0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <p class="header-logo">🚗 U-Ride</p>
      </div>
      <div class="body">${contenido}</div>
      <div class="footer">
        <p>Universidad Técnica de Ambato · Sistema de transporte estudiantil</p>
        <p>Este correo fue enviado automáticamente, por favor no respondas.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/* ── 1. Código de registro ─────────────────────────────── */
exports.enviarCodigoRegistro = async (correo, nombre, codigo) => {
  const contenido = `
    <h2>Hola, ${nombre} 👋</h2>
    <p>Gracias por registrarte en <strong>U-Ride</strong>. Para activar tu cuenta
       ingresa el siguiente código de verificación:</p>
    <div class="code-box">
      <div class="code">${codigo}</div>
      <p class="expires">Este código expira en <strong>15 minutos</strong></p>
    </div>
    <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
    <div class="note">
      🔒 Nunca compartas este código con nadie. U-Ride jamás te lo pedirá por otro medio.
    </div>
  `;

  return transporter.sendMail({
    from: FROM,
    to: correo,
    subject: "U-Ride — Verifica tu cuenta ✉️",
    html: plantillaBase(contenido),
  });
};

/* ── 2. Código de recuperación de contraseña ───────────── */
exports.enviarCodigoRecuperacion = async (correo, nombre, codigo) => {
  const contenido = `
    <h2>Hola, ${nombre}</h2>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta
       en <strong>U-Ride</strong>.</p>
    <p>Ingresa el siguiente código en la plataforma:</p>
    <div class="codeBox">
      <div class="code">${codigo}</div>
      <p class="expires">Este código expira en <strong>15 minutos</strong></p>
    </div>
    <p>Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.</p>
    <div class="note">
      🔒 Nunca compartas este código. U-Ride jamás te lo pedirá por otro medio.
    </div>
  `;

  return transporter.sendMail({
    from: FROM,
    to: correo,
    subject: "U-Ride — Recupera tu contraseña 🔑",
    html: plantillaBase(contenido),
  });
};

/* ── 3. Notificación: solicitud aceptada ───────────────── */
exports.notificarSolicitudAceptada = async (correo, nombre, viaje) => {
  const contenido = `
    <h2>¡Tu solicitud fue aceptada! 🎉</h2>
    <p>Hola <strong>${nombre}</strong>, el conductor aceptó tu solicitud para el siguiente viaje:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:.9rem;">
      <tr><td style="padding:8px;color:#64748B">Ruta</td>
          <td style="padding:8px;font-weight:600">${viaje.origen} → ${viaje.destino}</td></tr>
      <tr style="background:#F8FAFC">
          <td style="padding:8px;color:#64748B">Fecha</td>
          <td style="padding:8px;font-weight:600">${viaje.fecha}</td></tr>
      <tr><td style="padding:8px;color:#64748B">Hora</td>
          <td style="padding:8px;font-weight:600">${viaje.horaSalida}</td></tr>
    </table>
    <div class="note">
      📍 Recuerda estar en el punto de encuentro con <strong>5 minutos de anticipación</strong>.
    </div>
  `;

  return transporter.sendMail({
    from: FROM,
    to: correo,
    subject: "U-Ride — ¡Tu solicitud fue aceptada! 🚗",
    html: plantillaBase(contenido),
  });
};

/* ── 4. Notificación: solicitud rechazada ──────────────── */
exports.notificarSolicitudRechazada = async (correo, nombre, viaje) => {
  const contenido = `
    <h2>Tu solicitud fue rechazada</h2>
    <p>Hola <strong>${nombre}</strong>, lamentablemente el conductor no pudo aceptar
       tu solicitud para el viaje <strong>${viaje.origen} → ${viaje.destino}</strong>.</p>
    <p>Puedes buscar otros viajes disponibles en la plataforma.</p>
  `;

  return transporter.sendMail({
    from: FROM,
    to: correo,
    subject: "U-Ride — Solicitud no aceptada",
    html: plantillaBase(contenido),
  });
};
