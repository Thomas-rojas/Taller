import type { Express } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

const itemBorradorSchema = z.object({
  parte: z.string().max(100).optional().default(""),
  descripcion: z.string().max(500).optional().default(""),
  fotosViejos: z.array(z.string()).optional().default([]),
  fotosNuevos: z.array(z.string()).optional().default([]),
});

export type TrabajoBorradorItem = z.infer<typeof itemBorradorSchema>;

function esUrlFotoValida(url: string) {
  return url.startsWith("/uploads/trabajos/");
}

export function parsearTrabajosMultipart(
  trabajosRaw: string,
  archivos: Express.Multer.File[],
  opciones: { requiereFotosCompletas: boolean },
) {
  let trabajosParsed: unknown;
  try {
    trabajosParsed = JSON.parse(trabajosRaw);
  } catch {
    throw new AppError(400, "Formato de trabajos inválido.");
  }

  const trabajos = z
    .array(itemBorradorSchema)
    .min(1, "Agrega al menos un trabajo")
    .parse(trabajosParsed);

  const fotosPorTrabajo = Array.from({ length: trabajos.length }, () => ({
    viejos: [] as Express.Multer.File[],
    nuevos: [] as Express.Multer.File[],
  }));

  for (const archivo of archivos) {
    const match = archivo.fieldname.match(/^trabajo_(\d+)_(viejo|nuevo)$/);
    if (!match) continue;
    const indice = Number(match[1]);
    const tipo = match[2];
    if (indice < 0 || indice >= trabajos.length) continue;
    if (tipo === "viejo") fotosPorTrabajo[indice].viejos.push(archivo);
    else fotosPorTrabajo[indice].nuevos.push(archivo);
  }

  return trabajos.map((trabajo, index) => {
    const { viejos, nuevos } = fotosPorTrabajo[index];
    const fotosViejos = [
      ...(trabajo.fotosViejos ?? []).filter(esUrlFotoValida),
      ...viejos.map((f) => `/uploads/trabajos/${f.filename}`),
    ];
    const fotosNuevos = [
      ...(trabajo.fotosNuevos ?? []).filter(esUrlFotoValida),
      ...nuevos.map((f) => `/uploads/trabajos/${f.filename}`),
    ];

    if (opciones.requiereFotosCompletas && (fotosViejos.length === 0 || fotosNuevos.length === 0)) {
      throw new AppError(
        400,
        `En el trabajo «${trabajo.parte.trim() || index + 1}»: agrega al menos una foto de repuesto viejo y una de repuesto nuevo.`,
      );
    }

    return {
      parte: trabajo.parte.trim(),
      descripcion: trabajo.descripcion.trim(),
      fotosViejos,
      fotosNuevos,
    };
  });
}

export function trabajosBorradorTienenContenido(trabajos: TrabajoBorradorItem[]) {
  return trabajos.some(
    (t) =>
      t.parte.trim() ||
      t.descripcion.trim() ||
      (t.fotosViejos?.length ?? 0) > 0 ||
      (t.fotosNuevos?.length ?? 0) > 0,
  );
}

export async function guardarTrabajoBorrador(
  citaId: string,
  placa: string | undefined,
  trabajos: TrabajoBorradorItem[],
) {
  const data: { descripcionTrabajo: string | null; placa?: string } = {
    descripcionTrabajo: trabajosBorradorTienenContenido(trabajos)
      ? JSON.stringify(trabajos)
      : null,
  };

  if (placa?.trim()) {
    data.placa = placa.trim().toUpperCase();
  }

  return prisma.cita.update({
    where: { id: citaId },
    data,
    include: { servicio: true },
  });
}
