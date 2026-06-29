import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "./errorHandler.js";

declare global {
  namespace Express {
    interface Request {
      clienteId?: string;
    }
  }
}

export async function requireCliente(req: Request, _res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      throw new AppError(401, "Inicia sesión para continuar.");
    }

    const token = auth.slice(7).trim();
    if (!token) {
      throw new AppError(401, "Inicia sesión para continuar.");
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        sessionToken: token,
        activo: true,
        sessionExpiresAt: { gt: new Date() },
      },
    });

    if (!cliente) {
      throw new AppError(401, "Sesión expirada o inválida. Vuelve a iniciar sesión.");
    }

    req.clienteId = cliente.id;
    next();
  } catch (error) {
    next(error);
  }
}
