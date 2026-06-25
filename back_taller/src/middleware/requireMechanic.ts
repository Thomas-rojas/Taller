import type { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler.js";

export type StaffRole = "mecanico" | "admin";

declare global {
  namespace Express {
    interface Request {
      staffRole?: StaffRole;
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

export function requireMechanic(req: Request, _res: Response, next: NextFunction) {
  const claves = clavesAutorizadas();
  if (claves.length === 0) {
    return next(
      new AppError(
        503,
        "Panel no configurado. Define MECHANIC_API_KEY o ADMIN_API_KEY en .env",
      ),
    );
  }

  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : auth;

  const coincidencia = claves.find((c) => c.clave === token);
  if (!token || !coincidencia) {
    return next(
      new AppError(401, "Acceso no autorizado. Se requiere rol de mecánico o administrador."),
    );
  }

  req.staffRole = coincidencia.rol;
  next();
}

export function puedeVerDatosReparacion(
  cita: { registradoPor: string | null; datosReparacionBloqueados: boolean },
  staffRole: StaffRole,
) {
  if (!cita.datosReparacionBloqueados) return true;
  if (staffRole === "admin") return true;
  return cita.registradoPor === "mecanico";
}

export function filtrarCitaParaStaff<T extends {
  placa: string | null;
  descripcionTrabajo: string | null;
  registradoPor: string | null;
  datosReparacionBloqueados: boolean;
}>(cita: T, staffRole: StaffRole): T {
  if (puedeVerDatosReparacion(cita, staffRole)) return cita;
  return {
    ...cita,
    placa: null,
    descripcionTrabajo: null,
  };
}
