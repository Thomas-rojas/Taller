import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  calcularFechaEntrega,
  aFechaCalendario,
  esDomingo,
  validarHoraLlegada,
} from "../lib/fechas.js";
import { AppError } from "../middleware/errorHandler.js";
import { requireAdmin, requireMechanic, filtrarCitaParaStaff, registradoPorStaff } from "../middleware/requireMechanic.js";
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
import { uploadFotosTrabajo } from "../lib/uploadTrabajos.js";
import { uploadRegistroIngreso } from "../lib/uploadIngreso.js";
import { notificarClienteCitaConfirmada } from "../services/notificacionCita.js";
import {
  erroresNotificacionCliente,
  evaluarNotificacionCliente,
  whatsappAutomaticoHabilitado,
} from "../services/whatsappAuto.js";
import {
  nombreMecanicoRegistro,
  notificarAdminTrabajoFinalizado,
  notificarClienteCalidadEnRevision,
  notificarClienteListaRetiro,
} from "../services/notificacionEntrega.js";
import { registrarActividadCita } from "../services/citaActividad.js";
import { crearCitaSolicitud } from "../services/crearCitaSolicitud.js";
import {
  guardarTrabajoBorrador,
  parsearTrabajosMultipart,
  trabajosBorradorTienenContenido,
} from "../services/trabajoBorrador.js";

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
    res.json(citas.map((cita) => filtrarCitaParaStaff(cita, rol, req.mecanicoId)));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = crearCitaSchema.parse(req.body);

    const resultado = await crearCitaSolicitud({
      nombre: data.nombre,
      telefono: data.telefono,
      email: data.email || null,
      mensaje: data.mensaje || null,
      fechaPreferida: data.fechaPreferida,
      servicioId: data.servicioId || null,
    });

    res.status(201).json({
      message: resultado.message,
      cita: resultado.cita,
      calendarSync: resultado.calendarSync,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/confirmar", requireMechanic, async (req, res, next) => {
  try {
    if (req.staffRole === "admin") {
      throw new AppError(403, "El administrador no puede aceptar citas. Un mecánico debe hacerlo.");
    }

    const citaActual = await prisma.cita.findUnique({
      where: { id: idParam(req.params) },
      include: { servicio: true },
    });

    if (!citaActual) {
      throw new AppError(404, "Cita no encontrada");
    }

    if (citaActual.estado !== "pendiente") {
      throw new AppError(400, "Solo se pueden confirmar citas en estado pendiente.");
    }

    if (!citaActual.email?.trim() && !citaActual.telefono?.trim()) {
      throw new AppError(
        400,
        "El cliente no tiene correo ni teléfono registrado para enviar la notificación.",
      );
    }

    const cita = await prisma.cita.update({
      where: { id: citaActual.id },
      data: { estado: "confirmada" },
      include: { servicio: true },
    });

    const notificacion = await notificarClienteCitaConfirmada(cita);

    const tieneEmail = Boolean(cita.email?.trim());
    const tieneTelefono = Boolean(cita.telefono?.trim());

    if (!evaluarNotificacionCliente(tieneEmail, tieneTelefono, notificacion)) {
      await prisma.cita.update({
        where: { id: cita.id },
        data: { estado: "pendiente" },
      });

      const errores = erroresNotificacionCliente(tieneEmail, tieneTelefono, notificacion);

      throw new AppError(
        400,
        errores.join(" ") || "No se pudo notificar al cliente. La cita sigue pendiente.",
      );
    }

    await registrarActividadCita(
      cita.id,
      "confirmada",
      "Cita confirmada",
      "El taller confirmó tu cita.",
      { servicio: cita.servicio?.titulo ?? null },
    );

    const rol = req.staffRole ?? "mecanico";
    const partes: string[] = ["Cita aceptada."];

    if (notificacion.correoEnviado) {
      partes.push(`Correo enviado a ${cita.email}.`);
    }

    if (notificacion.whatsappEnviado) {
      partes.push("WhatsApp enviado automáticamente al cliente.");
    } else if (
      tieneTelefono &&
      whatsappAutomaticoHabilitado() &&
      notificacion.whatsappError
    ) {
      partes.push(`WhatsApp no enviado: ${notificacion.whatsappError}`);
    }

    res.json({
      message: partes.join(" "),
      cita: filtrarCitaParaStaff(cita, rol, req.mecanicoId),
      notificacion,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/reenviar-confirmacion", requireMechanic, async (req, res, next) => {
  try {
    const cita = await prisma.cita.findUnique({
      where: { id: idParam(req.params) },
      include: { servicio: true },
    });

    if (!cita) {
      throw new AppError(404, "Cita no encontrada");
    }

    if (cita.estado !== "confirmada") {
      throw new AppError(400, "Solo se puede reenviar la confirmación de citas confirmadas.");
    }

    const notificacion = await notificarClienteCitaConfirmada(cita);
    const tieneEmail = Boolean(cita.email?.trim());
    const tieneTelefono = Boolean(cita.telefono?.trim());

    if (!evaluarNotificacionCliente(tieneEmail, tieneTelefono, notificacion)) {
      const errores = erroresNotificacionCliente(tieneEmail, tieneTelefono, notificacion);
      throw new AppError(400, errores.join(" "));
    }

    const partes: string[] = ["Confirmación reenviada."];
    if (notificacion.correoEnviado) partes.push(`Correo a ${cita.email}.`);
    if (notificacion.whatsappEnviado) partes.push(`WhatsApp a ${cita.telefono}.`);

    const rol = req.staffRole ?? "mecanico";
    res.json({
      message: partes.join(" "),
      cita: filtrarCitaParaStaff(cita, rol, req.mecanicoId),
      notificacion,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:id/recibir",
  requireMechanic,
  (req, res, next) => {
    uploadRegistroIngreso(req, res, (err) => {
      if (err) {
        return next(new AppError(400, err instanceof Error ? err.message : "Error al subir archivos"));
      }
      next();
    });
  },
  async (req, res, next) => {
  try {
    const bodySchema = z.object({
      fechaRecepcion: z.string().optional(),
      estadoMotoIngreso: z
        .string()
        .min(1, "Describe el estado de la moto al ingresar")
        .max(2000, "La descripción es demasiado larga"),
    });
    const { fechaRecepcion: fechaRecepcionRaw, estadoMotoIngreso } = bodySchema.parse(req.body);

    const archivos = req.files as
      | { fotos?: Express.Multer.File[]; videos?: Express.Multer.File[] }
      | undefined;
    const fotos = archivos?.fotos ?? [];
    const videos = archivos?.videos ?? [];

    if (fotos.length === 0 && videos.length === 0) {
      throw new AppError(400, "Agrega al menos una foto o un video del estado de la moto.");
    }

    const citaActual = await prisma.cita.findUnique({
      where: { id: idParam(req.params) },
    });

    if (!citaActual) {
      throw new AppError(404, "Cita no encontrada");
    }

    if (citaActual.estado === "recibida") {
      throw new AppError(400, "Esta moto ya fue recibida en el taller.");
    }

    if (["entregada", "finalizada", "lista_retiro"].includes(citaActual.estado)) {
      throw new AppError(400, "Esta moto ya fue procesada en el taller.");
    }

    if (citaActual.estado === "cancelada") {
      throw new AppError(400, "No se puede recibir una cita cancelada.");
    }

    const fechaRecepcion = fechaRecepcionRaw
      ? parseFecha(fechaRecepcionRaw, "Fecha de recepción")
      : citaActual.fechaPreferida ?? new Date();

    const registroIngreso = {
      descripcion: estadoMotoIngreso.trim(),
      fotos: fotos.map((f) => `/uploads/ingreso/${f.filename}`),
      videos: videos.map((v) => `/uploads/ingreso/${v.filename}`),
    };

    const cita = await prisma.cita.update({
      where: { id: idParam(req.params) },
      data: {
        estado: "recibida",
        fechaRecepcion,
        estadoMotoIngreso: JSON.stringify(registroIngreso),
      },
      include: { servicio: true },
    });

    await crearBloqueosMes(cita.id, fechaRecepcion);

    await registrarActividadCita(
      cita.id,
      "recepcion",
      "Moto recibida en taller",
      registroIngreso.descripcion,
      registroIngreso,
    );

    const fechasBloqueadas = await obtenerFechasBloqueadas();
    const rol = req.staffRole ?? "mecanico";

    res.json({
      message: `Moto recibida. Días bloqueados desde ${aFechaCalendario(fechaRecepcion)} hasta fin de mes.`,
      cita: filtrarCitaParaStaff(cita, rol, req.mecanicoId),
      fechasBloqueadas,
    });
  } catch (error) {
    next(error);
  }
  },
);

router.post(
  "/:id/trabajo-borrador",
  requireMechanic,
  (req, res, next) => {
    uploadFotosTrabajo.any()(req, res, (err) => {
      if (err) {
        return next(new AppError(400, err instanceof Error ? err.message : "Error al subir fotos"));
      }
      next();
    });
  },
  async (req, res, next) => {
    try {
      const bodySchema = z.object({
        placa: z.string().max(10).optional(),
        trabajos: z.string().min(1, "Indica los trabajos"),
      });
      const { placa, trabajos: trabajosRaw } = bodySchema.parse(req.body);

      const archivos = (req.files as Express.Multer.File[] | undefined) ?? [];
      const trabajos = parsearTrabajosMultipart(trabajosRaw, archivos, {
        requiereFotosCompletas: false,
      });

      const citaActual = await prisma.cita.findUnique({
        where: { id: idParam(req.params) },
      });

      if (!citaActual) {
        throw new AppError(404, "Cita no encontrada");
      }

      if (citaActual.estado !== "recibida") {
        throw new AppError(400, "Solo se puede guardar el borrador mientras la moto está en taller.");
      }

      if (citaActual.datosReparacionBloqueados) {
        throw new AppError(400, "El trabajo ya fue finalizado y no puede modificarse.");
      }

      if (!trabajosBorradorTienenContenido(trabajos)) {
        throw new AppError(400, "Agrega al menos un dato o una foto para guardar.");
      }

      const cita = await guardarTrabajoBorrador(idParam(req.params), placa, trabajos);
      const rol = req.staffRole ?? "mecanico";

      res.json({
        message: "Borrador guardado. El cliente puede ver el avance en su portal.",
        cita: filtrarCitaParaStaff(cita, rol, req.mecanicoId),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/entregar",
  requireMechanic,
  (req, res, next) => {
    uploadFotosTrabajo.any()(req, res, (err) => {
      if (err) {
        return next(new AppError(400, err instanceof Error ? err.message : "Error al subir fotos"));
      }
      next();
    });
  },
  async (req, res, next) => {
  try {
    const bodySchema = z.object({
      fechaEntrega: z.string().min(1, "La fecha de entrega es requerida"),
      placa: z
        .string()
        .min(3, "La placa debe tener al menos 3 caracteres")
        .max(10, "La placa no puede exceder 10 caracteres"),
      trabajos: z.string().min(1, "Agrega al menos un trabajo"),
    });
    const { fechaEntrega: fechaEntregaRaw, placa, trabajos: trabajosRaw } =
      bodySchema.parse(req.body);

    const archivos = (req.files as Express.Multer.File[] | undefined) ?? [];
    const trabajos = parsearTrabajosMultipart(trabajosRaw, archivos, {
      requiereFotosCompletas: true,
    });

    const incompleto = trabajos.some((t) => !t.parte.trim() || !t.descripcion.trim());
    if (incompleto) {
      throw new AppError(400, "Cada trabajo debe tener la pieza y la descripción completas.");
    }

    const trabajosConFoto = trabajos;

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

    if (citaActual.datosReparacionBloqueados) {
      throw new AppError(
        400,
        "Los datos de reparación ya están registrados y no pueden modificarse.",
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
        estado: "finalizada",
        fechaEntregaReal,
        placa: placa.trim().toUpperCase(),
        descripcionTrabajo: JSON.stringify(trabajosConFoto),
        datosReparacionBloqueados: true,
        registradoPor: registradoPorStaff(req),
      },
      include: { servicio: true },
    });

    const diasLiberados = await ajustarBloqueosTrasEntrega(cita.id, fechaEntregaReal);
    const nombreMecanico = await nombreMecanicoRegistro(cita.registradoPor);
    const notificacionAdmin = await notificarAdminTrabajoFinalizado(cita, nombreMecanico);
    const notificacionCliente = await notificarClienteCalidadEnRevision(cita);

    for (const trabajo of trabajosConFoto) {
      await registrarActividadCita(
        cita.id,
        "trabajo",
        `Trabajo: ${trabajo.parte}`,
        trabajo.descripcion,
        trabajo,
      );
    }

    await registrarActividadCita(
      cita.id,
      "finalizada",
      "Trabajo finalizado — control de calidad",
      `Placa ${cita.placa}. Tu moto está en revisión de calidad.`,
      { placa: cita.placa },
    );

    const fechasBloqueadas = await obtenerFechasBloqueadas();
    const rol = req.staffRole ?? "mecanico";

    const partesAdmin: string[] = [];
    if (notificacionAdmin.correoEnviado) partesAdmin.push("correo");
    if (notificacionAdmin.whatsappEnviado) partesAdmin.push("WhatsApp");
    const avisoAdmin =
      partesAdmin.length > 0
        ? ` Administrador notificado por ${partesAdmin.join(" y ")}.`
        : " No se pudo notificar al administrador automáticamente.";

    const partesCliente: string[] = [];
    if (notificacionCliente.correoEnviado) partesCliente.push("correo");
    if (notificacionCliente.whatsappEnviado) partesCliente.push("WhatsApp");
    const avisoCliente =
      partesCliente.length > 0
        ? ` Cliente avisado de control de calidad por ${partesCliente.join(" y ")}.`
        : cita.telefono?.trim() || cita.email?.trim()
          ? " No se pudo avisar al cliente del control de calidad."
          : "";

    res.json({
      message: `Trabajo finalizado (placa ${cita.placa}). La moto pasa a control de calidad.${avisoCliente}${avisoAdmin}`,
      cita: filtrarCitaParaStaff(cita, rol, req.mecanicoId),
      periodoOcupado: { desde: fechaRecepcionISO, hasta: fechaEntregaISO },
      diasLiberados,
      fechasBloqueadas,
      notificacionAdmin,
      notificacionCliente,
    });
  } catch (error) {
    next(error);
  }
  },
);

router.post("/:id/notificar-retiro", requireAdmin, async (req, res, next) => {
  try {
    const citaActual = await prisma.cita.findUnique({
      where: { id: idParam(req.params) },
      include: { servicio: true },
    });

    if (!citaActual) {
      throw new AppError(404, "Cita no encontrada");
    }

    if (citaActual.estado !== "finalizada") {
      throw new AppError(400, "Solo se puede avisar al cliente cuando el trabajo está finalizado.");
    }

    if (!citaActual.email?.trim() && !citaActual.telefono?.trim()) {
      throw new AppError(400, "El cliente no tiene correo ni teléfono para enviar el aviso.");
    }

    const notificacion = await notificarClienteListaRetiro(citaActual);

    const tieneEmail = Boolean(citaActual.email?.trim());
    const tieneTelefono = Boolean(citaActual.telefono?.trim());

    if (!evaluarNotificacionCliente(tieneEmail, tieneTelefono, notificacion)) {
      const errores = erroresNotificacionCliente(tieneEmail, tieneTelefono, notificacion);
      throw new AppError(
        400,
        errores.join(" ") || "No se pudo notificar al cliente.",
      );
    }

    const cita = await prisma.cita.update({
      where: { id: citaActual.id },
      data: { estado: "lista_retiro" },
      include: { servicio: true },
    });

    await registrarActividadCita(
      cita.id,
      "lista_retiro",
      "Lista para retirar",
      "Tu moto pasó el control de calidad. Puedes pasar a recogerla.",
      { placa: cita.placa },
    );

    const partes: string[] = ["Cliente avisado: puede retirar su moto."];
    if (notificacion.correoEnviado) partes.push(`Correo enviado a ${cita.email}.`);
    if (notificacion.whatsappEnviado) partes.push("WhatsApp enviado al cliente.");

    res.json({
      message: partes.join(" "),
      cita,
      notificacion,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/entregar-cliente", requireMechanic, async (req, res, next) => {
  try {
    const citaActual = await prisma.cita.findUnique({
      where: { id: idParam(req.params) },
      include: { servicio: true },
    });

    if (!citaActual) {
      throw new AppError(404, "Cita no encontrada");
    }

    if (citaActual.estado !== "lista_retiro") {
      throw new AppError(
        400,
        "Solo se puede entregar la moto al cliente cuando ya fue avisado para retirarla.",
      );
    }

    const cita = await prisma.cita.update({
      where: { id: citaActual.id },
      data: {
        estado: "entregada",
        fechaEntregaReal: new Date(),
      },
      include: { servicio: true },
    });

    await registrarActividadCita(
      cita.id,
      "entregada",
      "Moto entregada",
      cita.placa
        ? `Entrega completada. Placa ${cita.placa}.`
        : "Entrega completada. ¡Gracias por confiar en nosotros!",
      { placa: cita.placa },
    );

    const rol = req.staffRole ?? "mecanico";
    res.json({
      message: `Moto entregada al cliente ${cita.nombre}${cita.placa ? ` (placa ${cita.placa})` : ""}.`,
      cita: filtrarCitaParaStaff(cita, rol, req.mecanicoId),
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/estado", requireMechanic, async (req, res, next) => {
  try {
    const estados = [
      "pendiente",
      "confirmada",
      "recibida",
      "finalizada",
      "lista_retiro",
      "entregada",
      "cancelada",
    ] as const;
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
