const viajeService = require("../services/viaje.service");

exports.buscarViajes = async (req, res, next) => {
  try {
    res.json(await viajeService.buscarViajes(req.query));
  } catch (e) {
    next(e);
  }
};
exports.crearViaje = async (req, res, next) => {
  try {
    res
      .status(201)
      .json(await viajeService.crearViaje(req.usuario.id, req.body));
  } catch (e) {
    next(e);
  }
};
exports.obtenerViaje = async (req, res, next) => {
  try {
    res.json(await viajeService.obtenerViajePorId(req.params.id));
  } catch (e) {
    next(e);
  }
};
exports.modificarViaje = async (req, res, next) => {
  try {
    res.json(
      await viajeService.modificarViaje(
        req.params.id,
        req.usuario.id,
        req.body,
      ),
    );
  } catch (e) {
    next(e);
  }
};
exports.cancelarViaje = async (req, res, next) => {
  try {
    res.json(await viajeService.cancelarViaje(req.params.id, req.usuario.id));
  } catch (e) {
    next(e);
  }
};
exports.misViajes = async (req, res, next) => {
  try {
    res.json({
      conductor: await viajeService.misViajesComoCondcutor(req.usuario.id),
      pasajero: await viajeService.misViajesComoPasajero(req.usuario.id),
    });
  } catch (e) {
    next(e);
  }
};

// Solicitudes
exports.enviarSolicitud = async (req, res, next) => {
  try {
    res
      .status(201)
      .json(
        await viajeService.enviarSolicitud(req.usuario.id, req.body.viajeId),
      );
  } catch (e) {
    next(e);
  }
};
exports.cancelarSolicitud = async (req, res, next) => {
  try {
    res.json(
      await viajeService.cancelarSolicitud(req.params.id, req.usuario.id),
    );
  } catch (e) {
    next(e);
  }
};
exports.aceptarSolicitud = async (req, res, next) => {
  try {
    res.json(
      await viajeService.aceptarSolicitud(req.params.id, req.usuario.id),
    );
  } catch (e) {
    next(e);
  }
};
exports.rechazarSolicitud = async (req, res, next) => {
  try {
    res.json(
      await viajeService.rechazarSolicitud(req.params.id, req.usuario.id),
    );
  } catch (e) {
    next(e);
  }
};
exports.solicitudesPend = async (req, res, next) => {
  try {
    res.json(await viajeService.solicitudesPendientes(req.usuario.id));
  } catch (e) {
    next(e);
  }
};

exports.iniciarViaje = async (req, res, next) => {
  try {
    res.json(await viajeService.iniciarViaje(req.params.id, req.usuario.id));
  } catch (e) {
    next(e);
  }
};

exports.finalizarViaje = async (req, res, next) => {
  try {
    res.json(await viajeService.finalizarViaje(req.params.id, req.usuario.id));
  } catch (e) {
    next(e);
  }
};
