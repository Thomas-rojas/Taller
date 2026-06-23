import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { calcularFechaEntrega } from "../lib/fechas.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  crearEventoEnGoogleCalendar,
  eliminarEventoDeGoogleCalendar,
  googleCalendarConfigurado,
} from "../services/googleCalendar.js";

const router = Router();

const crearCitaSchema = z.object({
  nombre: z.string().min(2, "El nombre es requerido"),
  telefono: z.string().min(7, "El teléfono es requerido"),
  email: z
    .string()
    .optional()
    .refine(
      (value) => !value || value === "" || z.email().safeParse(value).success,
      "Email inválido",
    ),
  mensaje: z.string().optional(),
  fechaPreferida: z.string().optional(),
  servicioId: z.string().optional(),
});

function parseFechaPreferida(valor?: string) {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    throw new AppError(400, "Fecha preferida inválida");
  }
  return fecha;
}

router.get("/", async (_req, res, next) => {
  try {
    const citas = await prisma.cita.findMany({
      include: { servicio: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(citas);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = crearCitaSchema.parse(req.body);

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
    const fechaEntrega = calcularFechaEntrega(fechaCita);

    let cita = await prisma.cita.create({
      data: {
        nombre: data.nombre,
        telefono: data.telefono,
        email: data.email || null,
        mensaje: data.mensaje || null,
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
          error instanceof Error
            ? error.message
            : "No se pudo sincronizar con Google Calendar";
        console.error("Error al sincronizar con Google Calendar:", error);
      }
    } else {
      calendarSync.error =
        "Google Calendar no está configurado. Agrega las credenciales en back_taller/.env";
    }

    res.status(201).json({
      message: "Cita registrada. Te contactaremos pronto.",
      cita,
      calendarSync,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/estado", async (req, res, next) => {
  try {
    const estados = ["pendiente", "confirmada", "cancelada"] as const;
    const schema = z.object({
      estado: z.enum(estados),
    });

    const { estado } = schema.parse(req.body);

    const citaActual = await prisma.cita.findUnique({
      where: { id: req.params.id },
    });

    if (!citaActual) {
      throw new AppError(404, "Cita no encontrada");
    }

    if (estado === "cancelada" && citaActual.googleEventId) {
      try {
        await eliminarEventoDeGoogleCalendar(citaActual.googleEventId);
      } catch (error) {
        console.error("No se pudo eliminar el evento de Google Calendar:", error);
      }
    }

    const cita = await prisma.cita.update({
      where: { id: req.params.id },
      data: { estado },
      include: { servicio: true },
    });

    res.json(cita);
  } catch (error) {
    next(error);
  }
});

export default router;
