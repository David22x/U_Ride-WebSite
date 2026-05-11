# U-Ride — Transporte universitario compartido

## Requisitos

- Node.js >= 18
- MySQL >= 8

## Instalación

```bash
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run db:migrate
npm run dev
```

## Scripts disponibles

| Comando              | Descripción            |
| -------------------- | ---------------------- |
| `npm run dev`        | Desarrollo con nodemon |
| `npm start`          | Producción             |
| `npm test`           | Pruebas                |
| `npm run db:migrate` | Ejecutar migraciones   |
| `npm run db:seed`    | Cargar datos de prueba |

## Arquitectura

Capas: Presentación → Rutas/Controladores → Servicios → Modelos → Base de datos

## Endpoints principales

- `POST /api/auth/registro`
- `POST /api/auth/login`
- `GET  /api/viajes`
- `POST /api/viajes`
- `POST /api/solicitudes`
- `WS   socket.io` — notificaciones en tiempo real
