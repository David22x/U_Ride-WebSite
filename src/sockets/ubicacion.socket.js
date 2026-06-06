/**
 * ubicacion.socket.js
 * Maneja los eventos de GPS tracking en tiempo real.
 *
 * Eventos que escucha (cliente → servidor):
 *   ubicacion:conductor   { viajeId, coords: {lat, lng} }
 *   viaje:unirse          { viajeId }   — pasajero se suscribe a la sala del viaje
 *   viaje:salir           { viajeId }   — pasajero abandona la sala
 *
 * Eventos que emite (servidor → clientes):
 *   ubicacion:{viajeId}   coords: {lat, lng}   — a todos en la sala del viaje
 */

module.exports = (io, socket) => {
  /**
   * Pasajero (o conductor mismo) se une a la sala de un viaje
   * para escuchar actualizaciones de ubicación.
   */
  socket.on("viaje:unirse", ({ viajeId }) => {
    if (!viajeId) return;
    socket.join(`viaje:${viajeId}`);
    console.log(`Socket ${socket.id} unido a sala viaje:${viajeId}`);
  });

  /**
   * Conductor emite su posición GPS.
   * El servidor la retransmite a todos los miembros de la sala del viaje.
   */
  socket.on("ubicacion:conductor", ({ viajeId, coords }) => {
    if (!viajeId || !coords?.lat || !coords?.lng) return;

    // Retransmitir a todos los pasajeros de ese viaje (excluyendo al propio conductor)
    socket.to(`viaje:${viajeId}`).emit(`ubicacion:${viajeId}`, coords);

    // También al propio conductor (para su mapa de confirmación)
    socket.emit(`ubicacion:${viajeId}`, coords);
  });

  /**
   * Pasajero abandona la sala del viaje (cuando cierra el modal/vista).
   */
  socket.on("viaje:salir", ({ viajeId }) => {
    if (!viajeId) return;
    socket.leave(`viaje:${viajeId}`);
    console.log(`Socket ${socket.id} salió de sala viaje:${viajeId}`);
  });
};
