import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword, generarTokenSesion } from "../lib/password.js";
import { AppError } from "../middleware/errorHandler.js";
import { requireAdmin, requireMechanic } from "../middleware/requireMechanic.js";
import {
  correoMecanicoConfigurado,
  enviarCorreoConfirmacionMecanico,
} from "../services/emailMecanico.js";

const router = Router();

const TIPOS_IDENTIFICACION = ["cedula", "pasaporte", "cedula_extranjeria", "tarjeta_identidad"] as const;

const celularSchema = z
  .string()
  .min(10, "El celular debe tener al menos 10 dígitos")
  .max(15, "El celular es demasiado largo")
  .regex(/^\+?\d[\d\s-]{8,14}\d$/, "Ingresa un número de celular válido");

const registroSchema = z.object({
  email: z.string().email("Correo inválido"),
  nombre: z.string().min(2, "El nombre es requerido").max(80, "El nombre es demasiado largo"),
  apellidos: z
    .string()
    .min(2, "Los apellidos son requeridos")
    .max(80, "Los apellidos son demasiado largos"),
  celular: celularSchema,
  direccion: z
    .string()
    .min(5, "La dirección de vivienda es requerida")
    .max(200, "La dirección es demasiado larga"),
  tipoIdentificacion: z.enum(TIPOS_IDENTIFICACION),
  identificacion: z
    .string()
    .min(5, "La identificación debe tener al menos 5 caracteres")
    .max(20, "La identificación es demasiado larga"),
});

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  identificacion: z.string().min(1, "Ingresa tu contraseña"),
});

function normalizarCelular(celular: string) {
  return celular.replace(/\D/g, "");
}

function idParam(params: { id?: string | string[] }) {
  const id = params.id;
  if (!id) throw new AppError(400, "ID requerido");
  return Array.isArray(id) ? id[0] : id;
}

function perfilPublico(mecanico: {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  celular: string;
  direccion: string;
  tipoIdentificacion: string;
  identificacion: string;
  aprobado: boolean;
  activo: boolean;
  createdAt: Date;
}) {
  return {
    id: mecanico.id,
    email: mecanico.email,
    nombre: mecanico.nombre,
    apellidos: mecanico.apellidos,
    celular: mecanico.celular,
    direccion: mecanico.direccion,
    tipoIdentificacion: mecanico.tipoIdentificacion,
    identificacion: mecanico.identificacion,
    aprobado: mecanico.aprobado,
    activo: mecanico.activo,
    createdAt: mecanico.createdAt,
  };
}

const SESSION_DAYS = 30;

async function crearSesion(mecanicoId: string) {
  const token = generarTokenSesion();
  const sessionExpiresAt = new Date();
  sessionExpiresAt.setDate(sessionExpiresAt.getDate() + SESSION_DAYS);

  await prisma.mecanico.update({
    where: { id: mecanicoId },
    data: { sessionToken: token, sessionExpiresAt },
  });

  return { token, expiresAt: sessionExpiresAt };
}

router.post("/registro", async (req, res, next) => {
  try {
    const data = registroSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();
    const celular = normalizarCelular(data.celular);

    const existente = await prisma.mecanico.findFirst({
      where: {
        OR: [
          { email },
          { celular },
          {
            tipoIdentificacion: data.tipoIdentificacion,
            identificacion: data.identificacion.trim(),
          },
        ],
      },
    });

    if (existente) {
      if (existente.email === email) {
        throw new AppError(409, "Ya existe una cuenta con este correo.");
      }
      if (existente.celular === celular) {
        throw new AppError(409, "Ya existe una cuenta con este celular.");
      }
      throw new AppError(409, "Ya existe una cuenta con esta identificación.");
    }

    const passwordHash = await hashPassword(data.identificacion.trim());

    let mecanico;
    try {
      mecanico = await prisma.mecanico.create({
        data: {
          email,
          nombre: data.nombre.trim(),
          apellidos: data.apellidos.trim(),
          celular,
          direccion: data.direccion.trim(),
          tipoIdentificacion: data.tipoIdentificacion,
          identificacion: data.identificacion.trim(),
          passwordHash,
        },
      });
    } catch (error) {
      console.error("Error al guardar mecánico:", error);
      throw new AppError(500, "No se pudo guardar el registro. Intenta de nuevo más tarde.");
    }

    let correoEnviado = false;
    let correoError: string | null = null;

    if (!correoMecanicoConfigurado()) {
      correoError =
        "Registro guardado, pero el correo no está configurado en el servidor (variables SMTP).";
      console.warn(correoError);
    } else {
      try {
        await enviarCorreoConfirmacionMecanico(mecanico);
        correoEnviado = true;
      } catch (error) {
        correoError =
          error instanceof Error
            ? error.message
            : "No se pudo enviar el correo de confirmación.";
        console.error("Error al enviar correo de confirmación:", error);
      }
    }

    const message = correoEnviado
      ? "Registro recibido. Te enviamos un correo de confirmación con tus datos. Un administrador revisará tu solicitud."
      : "Registro recibido. Un administrador revisará tu solicitud y te dará acceso al panel.";

    res.status(201).json({
      message,
      mecanico: perfilPublico(mecanico),
      correoEnviado,
      ...(correoError ? { correoError } : {}),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const mecanico = await prisma.mecanico.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!mecanico || !(await verifyPassword(data.identificacion, mecanico.passwordHash))) {
      throw new AppError(401, "Correo o contraseña incorrectos.");
    }

    if (!mecanico.activo) {
      throw new AppError(403, "Tu cuenta está desactivada. Contacta al administrador.");
    }

    if (!mecanico.aprobado) {
      throw new AppError(
        403,
        "Tu registro está pendiente de aprobación. Te avisaremos cuando tengas acceso.",
      );
    }

    const sesion = await crearSesion(mecanico.id);

    res.json({
      message: "Sesión iniciada correctamente.",
      token: sesion.token,
      expiresAt: sesion.expiresAt,
      mecanico: perfilPublico(mecanico),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", requireMechanic, async (req, res, next) => {
  try {
    if (req.mecanicoId) {
      await prisma.mecanico.update({
        where: { id: req.mecanicoId },
        data: { sessionToken: null, sessionExpiresAt: null },
      });
    }
    res.json({ message: "Sesión cerrada." });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireMechanic, async (req, res, next) => {
  try {
    if (!req.mecanicoId) {
      return res.json({
        tipo: "legacy",
        rol: req.staffRole ?? "mecanico",
      });
    }

    const mecanico = await prisma.mecanico.findUnique({
      where: { id: req.mecanicoId },
    });

    if (!mecanico) {
      throw new AppError(404, "Mecánico no encontrado.");
    }

    res.json({
      tipo: "mecanico",
      mecanico: perfilPublico(mecanico),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/pendientes", requireAdmin, async (_req, res, next) => {
  try {
    const pendientes = await prisma.mecanico.findMany({
      where: { aprobado: false, activo: true },
      orderBy: { createdAt: "asc" },
    });

    res.json(pendientes.map(perfilPublico));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/aprobar", requireAdmin, async (req, res, next) => {
  try {
    const id = idParam(req.params);

    const mecanico = await prisma.mecanico.update({
      where: { id },
      data: { aprobado: true },
    });

    res.json({
      message: `${mecanico.nombre} ${mecanico.apellidos} ya puede ingresar al panel.`,
      mecanico: perfilPublico(mecanico),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return next(new AppError(404, "Mecánico no encontrado."));
    }
    next(error);
  }
});

router.post("/:id/rechazar", requireAdmin, async (req, res, next) => {
  try {
    const id = idParam(req.params);

    await prisma.mecanico.delete({ where: { id } });

    res.json({ message: "Solicitud de registro eliminada." });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return next(new AppError(404, "Mecánico no encontrado."));
    }
    next(error);
  }
});

export default router;
