import { prisma } from "../lib/prisma.js";
import {
  calcularFechaEntrega,
  aFechaCalendario,
  esDomingo,
  validarHoraLlegada,
} from "../lib/fechas.js";
import { AppError } from "../middleware/errorHandler.js";
import { obtenerFechasBloqueadas } from "./bloqueos.js";
import {
  crearEventoEnGoogleCalendar,
  googleCalendarConfigurado,
} from "./googleCalendar.js";
import { registrarActividadCita } from "./citaActividad.js";

export type DatosCitaSolicitud = {
  nombre: string;
  telefono: string;
  email?: string | null;
  mensaje?: string | null;
  fechaPreferida?: string | null;
  servicioId?: string | null;
};

function parseFecha(valor: string, etiqueta: string) {
  const fecha = new Date(valor.includes("T") ? valor : `${valor}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) {
    throw new AppError(400, `${etiqueta} inválida`);
  }
  return fecha;
}

function parseFechaPreferida(valor?: string | null) {
  if (!valor) return null;
  return parseFecha(valor, "Fecha preferida");
}

export async function crearCitaSolicitud(data: DatosCitaSolicitud) {
  if (data.servicioId) {
    const servicio = await prisma.servicio.findUnique({
      where: { id: data.servicioId },
    });
    if (!servicio) {
      throw new AppError(404, "Servicio no encontrado");
    }
  }

  const fechaCita = data.fechaPreferida
    ? parseFechaPreferida(data.fechaPreferida)!
    : new Date();

  if (data.fechaPreferida) {
    if (esDomingo(fechaCita)) {
      throw new AppError(400, "No se pueden agendar citas los domingos.");
    }

    if (!validarHoraLlegada(fechaCita)) {
      throw new AppError(400, "La hora debe estar entre las 8:00 a.m. y las 6:00 p.m.");
    }

    const fechaISO = aFechaCalendario(fechaCita);
    const bloqueadas = await obtenerFechasBloqueadas();
    if (bloqueadas.includes(fechaISO)) {
      throw new AppError(
        400,
        "Esa fecha no está disponible. El taller tiene capacidad completa ese día.",
      );
    }
  }

  const fechaEntrega = calcularFechaEntrega(fechaCita);

  let cita = await prisma.cita.create({
    data: {
      nombre: data.nombre.trim(),
      telefono: data.telefono.trim(),
      email: data.email?.trim() || null,
      mensaje: data.mensaje?.trim() || null,
      fechaPreferida: parseFechaPreferida(data.fechaPreferida),
      fechaEntrega,
      servicioId: data.servicioId || null,
    },
    include: { servicio: true },
  });

  let calendarSync: {
    synced: boolean;
    eventId?: string;
    fechaEntrega: string;
    error?: string;
  } = {
    synced: false,
    fechaEntrega: fechaEntrega.toISOString(),
  };

  if (googleCalendarConfigurado()) {
    try {
      const eventId = await crearEventoEnGoogleCalendar(cita, fechaCita, fechaEntrega);
      cita = await prisma.cita.update({
        where: { id: cita.id },
        data: { googleEventId: eventId },
        include: { servicio: true },
      });
      calendarSync = {
        synced: true,
        eventId,
        fechaEntrega: fechaEntrega.toISOString(),
      };
    } catch (error) {
      calendarSync.error =
        error instanceof Error ? error.message : "No se pudo sincronizar con Google Calendar";
      console.error("Error al sincronizar con Google Calendar:", error);
    }
  } else {
    calendarSync.error =
      "Google Calendar no está configurado. Agrega las credenciales en back_taller/.env";
  }

  await registrarActividadCita(
    cita.id,
    "cita_solicitada",
    "Cita solicitada",
    cita.servicio?.titulo
      ? `Servicio: ${cita.servicio.titulo}`
      : "Tu cita fue registrada en el taller.",
    { servicio: cita.servicio?.titulo ?? null },
  );

  return {
    message: "Cita registrada. Te contactaremos pronto.",
    cita,
    calendarSync,
  };
}
