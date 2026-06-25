import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { calcularFechaEntrega, aFechaCalendario, esDomingo } from "../lib/fechas.js";
import { AppError } from "../middleware/errorHandler.js";
import { requireMechanic, filtrarCitaParaStaff } from "../middleware/requireMechanic.js";
import {
  crearBloqueosMes,
  ajustarBloqueosTrasEntrega,
  liberarBloqueosCita,
  obtenerFechasBloqueadas,
  obtenerCalendarioPublico,
} from "../services/bloqueos.js";
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

function parseFecha(valor: string, etiqueta: string) {
  const fecha = new Date(valor.includes("T") ? valor : `${valor}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) {
    throw new AppError(400, `${etiqueta} inválida`);
  }
  return fecha;
}

function parseFechaPreferida(valor?: string) {
  if (!valor) return null;
  return parseFecha(valor, "Fecha preferida");
}

function idParam(params: { id?: string | string[] }) {
  const id = params.id;
  if (!id) throw new AppError(400, "ID de cita requerido");
  return Array.isArray(id) ? id[0] : id;
}

router.get("/fechas-bloqueadas", async (_req, res, next) => {
  try {
    const calendario = await obtenerCalendarioPublico();
    res.json(calendario);
  } catch (error) {
    next(error);
  }
});

router.get("/", requireMechanic, async (req, res, next) => {
  try {
    const citas = await prisma.cita.findMany({
      include: { servicio: true },
      orderBy: { createdAt: "desc" },
    });
    const rol = req.staffRole ?? "mecanico";
    res.json(citas.map((cita) => filtrarCitaParaStaff(cita, rol)));
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

    if (data.fechaPreferida) {
      if (esDomingo(fechaCita)) {
        throw new AppError(400, "No se pueden agendar citas los domingos.");
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

router.post("/:id/recibir", requireMechanic, async (req, res, next) => {
  try {
    const schema = z.object({
      fechaRecepcion: z.string().optional(),
      placa: z
        .string()
        .min(3, "La placa debe tener al menos 3 caracteres")
        .max(10, "La placa no puede exceder 10 caracteres"),
      descripcionTrabajo: z
        .string()
        .min(1, "Describe el trabajo realizado")
        .max(2000, "La descripción es demasiado larga"),
    });
    const {
      fechaRecepcion: fechaRecepcionRaw,
      placa,
      descripcionTrabajo,
    } = schema.parse(req.body);

    const citaActual = await prisma.cita.findUnique({
      where: { id: idParam(req.params) },
    });

    if (!citaActual) {
      throw new AppError(404, "Cita no encontrada");
    }

    if (citaActual.datosReparacionBloqueados) {
      throw new AppError(
        400,
        "Los datos de reparación ya están registrados y no pueden modificarse.",
      );
    }

    if (citaActual.estado === "recibida") {
      throw new AppError(400, "Esta moto ya fue recibida en el taller.");
    }

    if (citaActual.estado === "entregada") {
      throw new AppError(400, "Esta moto ya fue entregada.");
    }

    if (citaActual.estado === "cancelada") {
      throw new AppError(400, "No se puede recibir una cita cancelada.");
    }

    const fechaRecepcion = fechaRecepcionRaw
      ? parseFecha(fechaRecepcionRaw, "Fecha de recepción")
      : citaActual.fechaPreferida ?? new Date();

    const cita = await prisma.cita.update({
      where: { id: idParam(req.params) },
      data: {
        estado: "recibida",
        fechaRecepcion,
        placa: placa.trim().toUpperCase(),
        descripcionTrabajo: descripcionTrabajo.trim(),
        datosReparacionBloqueados: true,
        registradoPor: req.staffRole ?? "mecanico",
      },
      include: { servicio: true },
    });

    await crearBloqueosMes(cita.id, fechaRecepcion);

    const fechasBloqueadas = await obtenerFechasBloqueadas();
    const rol = req.staffRole ?? "mecanico";

    res.json({
      message: `Moto recibida (placa ${cita.placa}). Días bloqueados desde ${aFechaCalendario(fechaRecepcion)} hasta fin de mes. Datos de reparación bloqueados.`,
      cita: filtrarCitaParaStaff(cita, rol),
      fechasBloqueadas,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/entregar", requireMechanic, async (req, res, next) => {
  try {
    const schema = z.object({
      fechaEntrega: z.string().min(1, "La fecha de entrega es requerida"),
    });
    const { fechaEntrega: fechaEntregaRaw } = schema.parse(req.body);

    const citaActual = await prisma.cita.findUnique({
      where: { id: idParam(req.params) },
    });

    if (!citaActual) {
      throw new AppError(404, "Cita no encontrada");
    }

    if (citaActual.estado !== "recibida") {
      throw new AppError(
        400,
        "Solo se pueden entregar motos que estén en estado recibida.",
      );
    }

    const fechaEntregaReal = parseFecha(fechaEntregaRaw, "Fecha de entrega");

    if (!citaActual.fechaRecepcion) {
      throw new AppError(400, "La cita no tiene fecha de recepción registrada.");
    }

    const fechaRecepcionISO = aFechaCalendario(citaActual.fechaRecepcion);
    const fechaEntregaISO = aFechaCalendario(fechaEntregaReal);

    if (fechaEntregaISO < fechaRecepcionISO) {
      throw new AppError(
        400,
        "La fecha de entrega no puede ser anterior a la recepción.",
      );
    }

    const cita = await prisma.cita.update({
      where: { id: idParam(req.params) },
      data: {
        estado: "entregada",
        fechaEntregaReal,
      },
      include: { servicio: true },
    });

    const diasLiberados = await ajustarBloqueosTrasEntrega(cita.id, fechaEntregaReal);

    const fechasBloqueadas = await obtenerFechasBloqueadas();
    const rol = req.staffRole ?? "mecanico";

    res.json({
      message: `Moto entregada. Ocupados del ${fechaRecepcionISO} al ${fechaEntregaISO}. ${diasLiberados} día(s) liberados para nuevas motos.`,
      cita: filtrarCitaParaStaff(cita, rol),
      periodoOcupado: { desde: fechaRecepcionISO, hasta: fechaEntregaISO },
      diasLiberados,
      fechasBloqueadas,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/estado", requireMechanic, async (req, res, next) => {
  try {
    const estados = ["pendiente", "confirmada", "recibida", "entregada", "cancelada"] as const;
    const schema = z.object({
      estado: z.enum(estados),
    });

    const { estado } = schema.parse(req.body);

    const citaActual = await prisma.cita.findUnique({
      where: { id: idParam(req.params) },
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

    if (estado === "cancelada") {
      await liberarBloqueosCita(citaActual.id);
    }

    const cita = await prisma.cita.update({
      where: { id: idParam(req.params) },
      data: { estado },
      include: { servicio: true },
    });

    res.json(cita);
  } catch (error) {
    next(error);
  }
});

export default router;
