import { prisma } from "../lib/prisma.js";
import { aFechaCalendario, generarFechasHastaFinDeMes } from "../lib/fechas.js";

export type RecepcionCalendario = {
  fecha: string;
  nombre: string;
  citaId: string;
};

export async function obtenerFechasBloqueadas(): Promise<string[]> {
  const rows = await prisma.diaBloqueado.findMany({
    where: { activo: true },
    select: { fecha: true },
    distinct: ["fecha"],
    orderBy: { fecha: "asc" },
  });

  return rows.map((row) => row.fecha);
}

export async function obtenerCalendarioPublico() {
  const [fechas, citasRecibidas] = await Promise.all([
    obtenerFechasBloqueadas(),
    prisma.cita.findMany({
      where: {
        estado: "recibida",
        fechaRecepcion: { not: null },
      },
      select: { id: true, nombre: true, fechaRecepcion: true },
      orderBy: { fechaRecepcion: "asc" },
    }),
  ]);

  const recepciones: RecepcionCalendario[] = citasRecibidas.map((cita) => ({
    fecha: aFechaCalendario(cita.fechaRecepcion!),
    nombre: cita.nombre,
    citaId: cita.id,
  }));

  return { fechas, recepciones };
}
export async function crearBloqueosMes(citaId: string, fechaRecepcion: Date) {
  const fechas = generarFechasHastaFinDeMes(fechaRecepcion);

  await prisma.diaBloqueado.createMany({
    data: fechas.map((fecha) => ({ fecha, citaId, activo: true })),
  });
}

export async function ajustarBloqueosTrasEntrega(citaId: string, fechaEntrega: Date) {
  const fechaEntregaISO = aFechaCalendario(fechaEntrega);

  const resultado = await prisma.diaBloqueado.updateMany({
    where: {
      citaId,
      activo: true,
      fecha: { gt: fechaEntregaISO },
    },
    data: { activo: false },
  });

  return resultado.count;
}

/** @deprecated Usar ajustarBloqueosTrasEntrega */
export async function desbloquearDiaEntrega(citaId: string, fechaEntrega: Date) {
  return ajustarBloqueosTrasEntrega(citaId, fechaEntrega);
}

export async function liberarBloqueosCita(citaId: string) {
  await prisma.diaBloqueado.updateMany({
    where: { citaId },
    data: { activo: false },
  });
}
