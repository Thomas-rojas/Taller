import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "./errorHandler.js";

export type StaffRole = "mecanico" | "admin";

declare global {
  namespace Express {
    interface Request {
      staffRole?: StaffRole;
      mecanicoId?: string;
    }
  }
}

function clavesAutorizadas(): Array<{ clave: string; rol: StaffRole }> {
  const claves: Array<{ clave: string; rol: StaffRole }> = [];
  if (process.env.MECHANIC_API_KEY) {
    claves.push({ clave: process.env.MECHANIC_API_KEY, rol: "mecanico" });
  }
  if (process.env.ADMIN_API_KEY) {
    claves.push({ clave: process.env.ADMIN_API_KEY, rol: "admin" });
  }
  return claves;
}

function extraerToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  return auth?.startsWith("Bearer ") ? auth.slice(7) : auth;
}

export async function resolverAuth(req: Request): Promise<boolean> {
  const token = extraerToken(req);
  if (!token) return false;

  const claves = clavesAutorizadas();
  const coincidencia = claves.find((c) => c.clave === token);
  if (coincidencia) {
    req.staffRole = coincidencia.rol;
    return true;
  }

  const mecanico = await prisma.mecanico.findFirst({
    where: {
      sessionToken: token,
      aprobado: true,
      activo: true,
      sessionExpiresAt: { gt: new Date() },
    },
  });

  if (mecanico) {
    req.staffRole = "mecanico";
    req.mecanicoId = mecanico.id;
    return true;
  }

  return false;
}

export async function requireMechanic(req: Request, _res: Response, next: NextFunction) {
  const claves = clavesAutorizadas();
  const token = extraerToken(req);

  if (claves.length === 0 && !token) {
    return next(
      new AppError(
        503,
        "Panel no configurado. Define MECHANIC_API_KEY, ADMIN_API_KEY o registra un mecánico.",
      ),
    );
  }

  const autenticado = await resolverAuth(req);
  if (!autenticado) {
    return next(
      new AppError(401, "Acceso no autorizado. Inicia sesión como mecánico o administrador."),
    );
  }

  next();
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const autenticado = await resolverAuth(req);
  if (!autenticado || req.staffRole !== "admin") {
    return next(new AppError(403, "Se requiere rol de administrador."));
  }
  next();
}

export function puedeVerDatosReparacion(
  cita: { registradoPor: string | null; datosReparacionBloqueados: boolean },
  staffRole: StaffRole,
  mecanicoId?: string,
) {
  if (!cita.datosReparacionBloqueados) return true;
  if (staffRole === "admin") return true;
  if (mecanicoId && cita.registradoPor === mecanicoId) return true;
  return cita.registradoPor === "mecanico";
}

export function filtrarCitaParaStaff<
  T extends {
    placa: string | null;
    descripcionTrabajo: string | null;
    registradoPor: string | null;
    datosReparacionBloqueados: boolean;
  },
>(cita: T, staffRole: StaffRole, mecanicoId?: string): T {
  if (puedeVerDatosReparacion(cita, staffRole, mecanicoId)) return cita;
  return {
    ...cita,
    placa: null,
    descripcionTrabajo: null,
  };
}

export function registradoPorStaff(req: Request): string {
  if (req.mecanicoId) return req.mecanicoId;
  return req.staffRole ?? "mecanico";
}
