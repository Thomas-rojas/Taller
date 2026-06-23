# Moto Taller — Backend API

API REST para el taller de motos. Gestiona citas, servicios, galería, chat y configuración.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
cd back_taller
npm install
cp .env.example .env
npm run db:setup
```

## Desarrollo

```bash
npm run dev
```

La API queda en `http://localhost:4000`.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servidor |
| GET | `/api/servicios` | Lista servicios activos |
| GET | `/api/galeria` | Lista imágenes de galería |
| GET | `/api/config` | Datos de contacto del taller |
| GET | `/api/chat/faqs` | Preguntas frecuentes del chat |
| POST | `/api/chat` | Enviar mensaje y recibir respuesta |
| GET | `/api/citas` | Listar citas (admin) |
| POST | `/api/citas` | Crear solicitud de cita |
| PATCH | `/api/citas/:id/estado` | Cambiar estado de cita |

### Ejemplo: crear cita

```bash
curl -X POST http://localhost:4000/api/citas \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Juan Pérez\",\"telefono\":\"3001234567\",\"mensaje\":\"Quiero mantenimiento\"}"
```

### Ejemplo: chat

```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"mensaje\":\"¿Cuál es su horario?\"}"
```

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | URL de SQLite | `file:./dev.db` |
| `PORT` | Puerto del servidor | `4000` |
| `CORS_ORIGIN` | Origen del front | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Client ID de Google Cloud | — |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google Cloud | — |
| `GOOGLE_REFRESH_TOKEN` | Token OAuth del calendario | — |
| `GOOGLE_CALENDAR_ID` | ID del calendario | `primary` |

## Google Calendar

Al crear una cita (`POST /api/citas`), el sistema:

1. Guarda la cita en la base de datos.
2. Calcula la **fecha de entrega** sumando **7 días** a la fecha de la cita.
3. Crea un evento en Google Calendar de `thomasduranrojas@gmail.com` con todos los detalles.

### Configuración (una sola vez)

1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto y habilita **Google Calendar API**.
3. En **Credenciales**, crea un **ID de cliente OAuth** (tipo: aplicación de escritorio o web).
4. Agrega como URI de redirección: `http://localhost:4000/oauth2callback`
5. Copia `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en tu `.env`.
6. Ejecuta:

```bash
npm.cmd run google:auth
```

7. Inicia sesión con **thomasduranrojas@gmail.com**, autoriza y pega el código.
8. Copia el `GOOGLE_REFRESH_TOKEN` que imprime el script a tu `.env`.
9. Reinicia el backend.

### Respuesta al crear cita

```json
{
  "message": "Cita registrada. Te contactaremos pronto.",
  "cita": { "...": "..." },
  "calendarSync": {
    "synced": true,
    "eventId": "abc123",
    "fechaEntrega": "2026-06-30T..."
  }
}
```
