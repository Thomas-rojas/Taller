import { google } from "googleapis";
import type { Cita, Servicio } from "@prisma/client";
import {
  TIMEZONE,
  DIAS_RETRASO_ENTREGA,
  aFechaCalendario,
  diaSiguiente,
  formatearFecha,
  formatearFechaHora,
} from "../lib/fechas.js";

type CitaConServicio = Cita & { servicio: Servicio | null };

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Faltan credenciales de Google Calendar. Configura GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REFRESH_TOKEN.",
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4000/oauth2callback",
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

export function googleCalendarConfigurado() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN,
  );
}

function construirDescripcion(cita: CitaConServicio, fechaCita: Date, fechaEntrega: Date) {
  const lineas = [
    "Cita registrada desde Moto Taller",
    "",
    `Cliente: ${cita.nombre}`,
    `Teléfono: ${cita.telefono}`,
    `Email: ${cita.email ?? "No indicado"}`,
    `Servicio: ${cita.servicio?.titulo ?? "No especificado"}`,
    `Estado: ${cita.estado}`,
    `Fecha de cita original: ${formatearFechaHora(fechaCita)}`,
    `Fecha de entrega programada (+${DIAS_RETRASO_ENTREGA} días): ${formatearFecha(fechaEntrega)}`,
    "",
    `Mensaje del cliente: ${cita.mensaje ?? "Sin mensaje adicional"}`,
    "",
    `ID interno: ${cita.id}`,
  ];

  return lineas.join("\n");
}

export async function crearEventoEnGoogleCalendar(
  cita: CitaConServicio,
  fechaCita: Date,
  fechaEntrega: Date,
) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "primary";
  const fechaEntregaISO = aFechaCalendario(fechaEntrega);

  const event = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `Entrega Moto Taller - ${cita.nombre}`,
      description: construirDescripcion(cita, fechaCita, fechaEntrega),
      location: "Moto Taller Familiar",
      start: {
        date: fechaEntregaISO,
        timeZone: TIMEZONE,
      },
      end: {
        date: diaSiguiente(fechaEntregaISO),
        timeZone: TIMEZONE,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 24 * 60 },
          { method: "popup", minutes: 60 },
        ],
      },
    },
  });

  if (!event.data.id) {
    throw new Error("Google Calendar no devolvió un ID de evento.");
  }

  return event.data.id;
}

export async function eliminarEventoDeGoogleCalendar(eventId: string) {
  if (!googleCalendarConfigurado()) return;

  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "primary";

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}
