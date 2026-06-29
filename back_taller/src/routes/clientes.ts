import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword, generarTokenSesion } from "../lib/password.js";
import { AppError } from "../middleware/errorHandler.js";
import { requireCliente } from "../middleware/requireCliente.js";
import {
  actividadPublica,
  obtenerActividadesCliente,
} from "../services/citaActividad.js";
import { obtenerNovedadesMoto } from "../services/novedadesMoto.js";
import { crearCitaSolicitud } from "../services/crearCitaSolicitud.js";

const router = Router();

const SESSION_DAYS = 30;

const telefonoSchema = z
  .string()
  .min(10, "El teléfono debe tener al menos 10 dígitos")
  .max(15, "El teléfono es demasiado largo")
  .regex(/^\+?\d[\d\s-]{8,14}\d$/, "Ingresa un número de teléfono válido");

const registroSchema = z.object({
  nombre: z.string().min(2, "El nombre es requerido").max(80),
  telefono: telefonoSchema,
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(64),
});

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

const reservarCitaSchema = z.object({
  mensaje: z.string().max(1000).optional(),
  fechaPreferida: z.string().min(1, "Selecciona fecha y hora para llevar la moto"),
  servicioId: z.string().optional(),
});

const testimonioSchema = z.object({
  moto: z.string().min(2, "Indica tu moto").max(80, "Nombre de moto demasiado largo"),
  texto: z
    .string()
    .min(20, "Cuéntanos un poco más sobre tu experiencia (mínimo 20 caracteres)")
    .max(500, "El testimonio no puede superar 500 caracteres"),
});

function normalizarTelefono(telefono: string) {
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length === 10 && digitos.startsWith("3")) return `57${digitos}`;
  return digitos;
}

function telefonosEquivalentes(a: string, b: string) {
  const na = normalizarTelefono(a);
  const nb = normalizarTelefono(b);
  return na === nb || na.endsWith(nb) || nb.endsWith(na);
}

async function clienteTieneMotoEntregada(clienteId: string) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
  });
  if (!cliente) return false;

  const citas = await prisma.cita.findMany({
    where: {
      estado: "entregada",
      OR: [{ email: cliente.email }, { telefono: cliente.telefono }],
    },
  });

  return citas.some(
    (cita) =>
      cita.email?.toLowerCase() === cliente.email.toLowerCase() ||
      telefonosEquivalentes(cita.telefono, cliente.telefono),
  );
}

function perfilPublico(cliente: {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  createdAt: Date;
}) {
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    telefono: cliente.telefono,
    email: cliente.email,
    createdAt: cliente.createdAt,
  };
}

async function crearSesion(clienteId: string) {
  const token = generarTokenSesion();
  const sessionExpiresAt = new Date();
  sessionExpiresAt.setDate(sessionExpiresAt.getDate() + SESSION_DAYS);

  await prisma.cliente.update({
    where: { id: clienteId },
    data: { sessionToken: token, sessionExpiresAt },
  });

  return { token, expiresAt: sessionExpiresAt };
}

router.post("/registro", async (req, res, next) => {
  try {
    const data = registroSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();
    const telefono = normalizarTelefono(data.telefono);

    const existente = await prisma.cliente.findFirst({
      where: { OR: [{ email }, { telefono }] },
    });

    if (existente) {
      if (existente.email === email) {
        throw new AppError(409, "Ya existe una cuenta con este correo.");
      }
      throw new AppError(409, "Ya existe una cuenta con este teléfono.");
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre: data.nombre.trim(),
        email,
        telefono,
        passwordHash: await hashPassword(data.password),
      },
    });

    const sesion = await crearSesion(cliente.id);

    res.status(201).json({
      message: "Cuenta creada correctamente.",
      token: sesion.token,
      expiresAt: sesion.expiresAt,
      cliente: perfilPublico(cliente),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const cliente = await prisma.cliente.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (!cliente || !(await verifyPassword(data.password, cliente.passwordHash))) {
      throw new AppError(401, "Correo o contraseña incorrectos.");
    }

    if (!cliente.activo) {
      throw new AppError(403, "Tu cuenta está desactivada. Contacta al taller.");
    }

    const sesion = await crearSesion(cliente.id);

    res.json({
      message: "Sesión iniciada correctamente.",
      token: sesion.token,
      expiresAt: sesion.expiresAt,
      cliente: perfilPublico(cliente),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", requireCliente, async (req, res, next) => {
  try {
    if (req.clienteId) {
      await prisma.cliente.update({
        where: { id: req.clienteId },
        data: { sessionToken: null, sessionExpiresAt: null },
      });
    }
    res.json({ message: "Sesión cerrada." });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireCliente, async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.clienteId },
    });

    if (!cliente) {
      throw new AppError(404, "Cliente no encontrado.");
    }

    res.json({ cliente: perfilPublico(cliente) });
  } catch (error) {
    next(error);
  }
});

router.get("/mis-citas", requireCliente, async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.clienteId },
    });

    if (!cliente) {
      throw new AppError(404, "Cliente no encontrado.");
    }

    const citas = await prisma.cita.findMany({
      where: {
        OR: [{ email: cliente.email }, { telefono: cliente.telefono }],
      },
      include: { servicio: true },
      orderBy: { createdAt: "desc" },
    });

    const citasFiltradas = citas.filter(
      (cita) =>
        cita.email?.toLowerCase() === cliente.email ||
        telefonosEquivalentes(cita.telefono, cliente.telefono),
    );

    res.json(
      citasFiltradas.map((cita) => ({
        id: cita.id,
        estado: cita.estado,
        nombre: cita.nombre,
        placa: cita.placa,
        fechaPreferida: cita.fechaPreferida?.toISOString() ?? null,
        fechaRecepcion: cita.fechaRecepcion?.toISOString() ?? null,
        fechaEntregaReal: cita.fechaEntregaReal?.toISOString() ?? null,
        servicio: cita.servicio
          ? { id: cita.servicio.id, titulo: cita.servicio.titulo }
          : null,
        createdAt: cita.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/actividad", requireCliente, async (req, res, next) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.clienteId },
    });

    if (!cliente) {
      throw new AppError(404, "Cliente no encontrado.");
    }

    const citas = await prisma.cita.findMany({
      where: {
        OR: [{ email: cliente.email }, { telefono: cliente.telefono }],
      },
      include: { servicio: true },
      orderBy: { createdAt: "desc" },
    });

    const citasFiltradas = citas.filter(
      (cita) =>
        cita.email?.toLowerCase() === cliente.email ||
        telefonosEquivalentes(cita.telefono, cliente.telefono),
    );

    const actividades = await obtenerActividadesCliente(citasFiltradas);
    res.json(actividades.map(actividadPublica));
  } catch (error) {
    next(error);
  }
});

router.get("/novedades", requireCliente, async (_req, res, next) => {
  try {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    const novedades = await obtenerNovedadesMoto();
    res.json(novedades);
  } catch (error) {
    next(error);
  }
});

router.post("/reservar-cita", requireCliente, async (req, res, next) => {
  try {
    const data = reservarCitaSchema.parse(req.body);

    const cliente = await prisma.cliente.findUnique({
      where: { id: req.clienteId },
    });

    if (!cliente) {
      throw new AppError(404, "Cliente no encontrado.");
    }

    const resultado = await crearCitaSolicitud({
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
      mensaje: data.mensaje ?? null,
      fechaPreferida: data.fechaPreferida,
      servicioId: data.servicioId ?? null,
    });

    res.status(201).json({
      message: resultado.message,
      cita: {
        id: resultado.cita.id,
        estado: resultado.cita.estado,
        fechaPreferida: resultado.cita.fechaPreferida?.toISOString() ?? null,
        servicio: resultado.cita.servicio
          ? { id: resultado.cita.servicio.id, titulo: resultado.cita.servicio.titulo }
          : null,
      },
      calendarSync: resultado.calendarSync,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/mi-testimonio", requireCliente, async (req, res, next) => {
  try {
    const testimonio = await prisma.testimonio.findUnique({
      where: { clienteId: req.clienteId! },
      select: {
        id: true,
        nombre: true,
        moto: true,
        texto: true,
        publicado: true,
        createdAt: true,
      },
    });

    res.json({ testimonio });
  } catch (error) {
    next(error);
  }
});

router.post("/testimonio", requireCliente, async (req, res, next) => {
  try {
    const data = testimonioSchema.parse(req.body);

    const cliente = await prisma.cliente.findUnique({
      where: { id: req.clienteId! },
    });

    if (!cliente) {
      throw new AppError(404, "Cliente no encontrado");
    }

    const puedePublicar = await clienteTieneMotoEntregada(cliente.id);
    if (!puedePublicar) {
      throw new AppError(
        403,
        "Solo puedes publicar un testimonio cuando el taller ya te entregó la moto.",
      );
    }

    const testimonio = await prisma.testimonio.upsert({
      where: { clienteId: cliente.id },
      create: {
        clienteId: cliente.id,
        nombre: cliente.nombre,
        moto: data.moto.trim(),
        texto: data.texto.trim(),
        publicado: true,
      },
      update: {
        nombre: cliente.nombre,
        moto: data.moto.trim(),
        texto: data.texto.trim(),
        publicado: true,
      },
      select: {
        id: true,
        nombre: true,
        moto: true,
        texto: true,
        publicado: true,
        createdAt: true,
      },
    });

    res.json({
      message: "Tu testimonio fue publicado en la página principal.",
      testimonio,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
