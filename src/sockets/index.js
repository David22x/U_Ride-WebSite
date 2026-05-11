const { Server } = require("socket.io");
const solicitudSocket = require("./solicitud.socket");

function initSockets(server) {
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  io.on("connection", (socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    // El usuario se une a su sala personal para recibir notificaciones
    socket.on("unirse", (usuarioId) => socket.join(`user:${usuarioId}`));

    solicitudSocket(io, socket);

    socket.on("disconnect", () =>
      console.log(`Socket desconectado: ${socket.id}`),
    );
  });

  return io;
}

module.exports = { initSockets };
