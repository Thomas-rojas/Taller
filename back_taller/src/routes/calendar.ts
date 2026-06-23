import { Router } from "express";
import { google } from "googleapis";
import { googleCalendarConfigurado, crearEventoEnGoogleCalendar } from "../services/googleCalendar.js";
import { calcularFechaEntrega } from "../lib/fechas.js";

const router = Router();

router.get("/status", (_req, res) => {
  res.json({
    configurado: googleCalendarConfigurado(),
    cuenta: "thomasduranrojas@gmail.com",
    variables: {
      GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
      GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      GOOGLE_REFRESH_TOKEN: Boolean(process.env.GOOGLE_REFRESH_TOKEN),
      GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID ?? "primary",
    },
  });
});

router.get("/auth-url", (_req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(400).json({
      error: "Agrega GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en back_taller/.env",
    });
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4000/oauth2callback";

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
  });

  res.json({ url, redirectUri });
});

router.post("/test", async (_req, res, next) => {
  try {
    if (!googleCalendarConfigurado()) {
      return res.status(400).json({
        error: "Google Calendar no configurado. Ejecuta: npm run google:setup",
      });
    }

    const fechaCita = new Date();
    const fechaEntrega = calcularFechaEntrega(fechaCita);

    const citaPrueba = {
      id: "test-cita",
      nombre: "Cliente de prueba",
      telefono: "3000000000",
      email: "thomasduranrojas@gmail.com",
      mensaje: "Evento de prueba de integración",
      fechaPreferida: fechaCita,
      fechaEntrega,
      googleEventId: null,
      estado: "pendiente",
      servicioId: null,
      createdAt: fechaCita,
      updatedAt: fechaCita,
      servicio: {
        id: "test-servicio",
        titulo: "Mantenimiento General",
        descripcion: "Prueba",
        icono: "⚙️",
        activo: true,
        orden: 1,
        createdAt: fechaCita,
        updatedAt: fechaCita,
      },
    };

    const eventId = await crearEventoEnGoogleCalendar(citaPrueba, fechaCita, fechaEntrega);

    res.json({
      ok: true,
      message: "Evento de prueba creado en Google Calendar",
      eventId,
      fechaEntrega: fechaEntrega.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
