require('dotenv').config();
const express     = require('express');
const http        = require('http');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const cookieParser = require('cookie-parser');

const { connectDB }     = require('./config/database');
const { initSockets }   = require('./sockets');
const routes            = require('./routes');
const { errorHandler }  = require('./middlewares/errorHandler');
const logger            = require('./utils/logger');

const app    = express();
const server = http.createServer(app);

// ── Middlewares globales ──────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// ── Rutas ─────────────────────────────────────────────
app.use('/api', routes);

// ── Socket.IO ─────────────────────────────────────────
initSockets(server);

// ── Manejo de errores ─────────────────────────────────
app.use(errorHandler);

// ── Arranque ──────────────────────────────────────────
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`Servidor U-Ride corriendo en http://localhost:${PORT}`);
  });
});

module.exports = { app, server };
