const solicitudService = require("../services/solicitud.service");

module.exports = (io, socket) => {
  // Conductor acepta solicitud → notificar al pasajero en tiempo real
  socket.on("solicitud:aceptar", async ({ solicitudId, conductorId }) => {
    try {
      const solicitud = await solicitudService.aceptar(
        solicitudId,
        conductorId,
      );
      // Notificar al pasajero
      io.to(`user:${solicitud.pasajeroId}`).emit("solicitud:aceptada", {
        mensaje: "¡Tu solicitud fue aceptada!",
        viajeId: solicitud.viajeId,
      });
      // Confirmar al conductor
      socket.emit("solicitud:confirmada", { solicitudId });
    } catch (err) {
      socket.emit("error", { mensaje: err.message });
    }
  });

  // Conductor rechaza solicitud
  socket.on("solicitud:rechazar", async ({ solicitudId, conductorId }) => {
    try {
      const solicitud = await solicitudService.rechazar(
        solicitudId,
        conductorId,
      );
      io.to(`user:${solicitud.pasajeroId}`).emit("solicitud:rechazada", {
        mensaje: "Tu solicitud fue rechazada.",
        viajeId: solicitud.viajeId,
      });
    } catch (err) {
      socket.emit("error", { mensaje: err.message });
    }
  });
};
