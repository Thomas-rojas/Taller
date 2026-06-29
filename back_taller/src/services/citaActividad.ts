import { prisma } from "../lib/prisma.js";

export type TipoActividadCita =
  | "cita_solicitada"
  | "confirmada"
  | "recepcion"
  | "trabajo"
  | "finalizada"
  | "lista_retiro"
  | "entregada"
  | "cancelada";

type CitaConServicio = {
  id: string;
  estado: string;
  placa: string | null;
  estadoMotoIngreso: string | null;
  descripcionTrabajo: string | null;
  fechaPreferida: Date | null;
  fechaRecepcion: Date | null;
  fechaEntregaReal: Date | null;
  createdAt: Date;
  servicio: { titulo: string } | null;
};

export async function registrarActividadCita(
  citaId: string,
  tipo: TipoActividadCita,
  titulo: string,
  descripcion?: string | null,
  datos?: unknown,
) {
  return prisma.citaActividad.create({
    data: {
      citaId,
      tipo,
      titulo,
      descripcion: descripcion ?? null,
      datos: datos !== undefined ? JSON.stringify(datos) : null,
    },
  });
}

function parseJson<T>(raw: string | null | undefined): T | null {
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function sintetizarActividades(cita: CitaConServicio) {
  const items: {
    tipo: TipoActividadCita;
    titulo: string;
    descripcion: string | null;
    datos: unknown;
    createdAt: Date;
  }[] = [];

  const servicio = cita.servicio?.titulo ?? null;

  items.push({
    tipo: "cita_solicitada",
    titulo: "Cita solicitada",
    descripcion: servicio ? `Servicio: ${servicio}` : "Tu cita fue registrada en el taller.",
    datos: { servicio },
    createdAt: cita.createdAt,
  });

  const estadosAvanzados = [
    "confirmada",
    "recibida",
    "finalizada",
    "lista_retiro",
    "entregada",
    "cancelada",
  ];
  const ordenEstado = estadosAvanzados.indexOf(cita.estado);

  if (ordenEstado >= 0) {
    items.push({
      tipo: "confirmada",
      titulo: "Cita confirmada",
      descripcion: "El taller confirmó tu cita.",
      datos: { servicio },
      createdAt: cita.fechaPreferida ?? cita.createdAt,
    });
  }

  const ingreso = parseJson<{
    descripcion: string;
    fotos: string[];
    videos: string[];
  }>(cita.estadoMotoIngreso);

  if (ingreso && ordenEstado >= 1) {
    items.push({
      tipo: "recepcion",
      titulo: "Moto recibida en taller",
      descripcion: ingreso.descripcion,
      datos: ingreso,
      createdAt: cita.fechaRecepcion ?? cita.createdAt,
    });
  }

  const trabajos = parseJson<
    {
      parte: string;
      descripcion: string;
      fotosViejos?: string[];
      fotosNuevos?: string[];
      foto?: string;
    }[]
  >(cita.descripcionTrabajo);

  if (trabajos?.length && ordenEstado >= 2) {
    for (const trabajo of trabajos) {
      items.push({
        tipo: "trabajo",
        titulo: `Trabajo: ${trabajo.parte}`,
        descripcion: trabajo.descripcion,
        datos: {
          parte: trabajo.parte,
          descripcion: trabajo.descripcion,
          fotosViejos: trabajo.fotosViejos ?? (trabajo.foto ? [trabajo.foto] : []),
          fotosNuevos: trabajo.fotosNuevos ?? [],
        },
        createdAt: cita.fechaEntregaReal ?? cita.createdAt,
      });
    }

    items.push({
      tipo: "finalizada",
      titulo: "Trabajo finalizado — control de calidad",
      descripcion: cita.placa
        ? `Placa ${cita.placa}. Tu moto está en revisión de calidad.`
        : "Tu moto está en revisión de calidad.",
      datos: { placa: cita.placa },
      createdAt: cita.fechaEntregaReal ?? cita.createdAt,
    });
  }

  if (["lista_retiro", "entregada"].includes(cita.estado)) {
    items.push({
      tipo: "lista_retiro",
      titulo: "Lista para retirar",
      descripcion: "Tu moto pasó el control de calidad. Puedes pasar a recogerla.",
      datos: { placa: cita.placa },
      createdAt: cita.fechaEntregaReal ?? cita.createdAt,
    });
  }

  if (cita.estado === "entregada") {
    items.push({
      tipo: "entregada",
      titulo: "Moto entregada",
      descripcion: cita.placa
        ? `Entrega completada. Placa ${cita.placa}.`
        : "Entrega completada. ¡Gracias por confiar en nosotros!",
      datos: { placa: cita.placa },
      createdAt: cita.fechaEntregaReal ?? cita.createdAt,
    });
  }

  if (cita.estado === "cancelada") {
    items.push({
      tipo: "cancelada",
      titulo: "Cita cancelada",
      descripcion: "Esta cita fue cancelada.",
      datos: null,
      createdAt: cita.createdAt,
    });
  }

  return items;
}

export async function obtenerActividadesCliente(citas: CitaConServicio[]) {
  const ids = citas.map((c) => c.id);
  if (ids.length === 0) return [];

  const registradas = await prisma.citaActividad.findMany({
    where: { citaId: { in: ids } },
    orderBy: { createdAt: "desc" },
  });

  const citasConRegistro = new Set(registradas.map((a) => a.citaId));
  const sinteticas = citas
    .filter((c) => !citasConRegistro.has(c.id))
    .flatMap((cita) =>
      sintetizarActividades(cita).map((item, index) => ({
        id: `sint-${cita.id}-${index}`,
        citaId: cita.id,
        tipo: item.tipo,
        titulo: item.titulo,
        descripcion: item.descripcion,
        datos: item.datos,
        createdAt: item.createdAt,
        placa: cita.placa,
        servicio: cita.servicio?.titulo ?? null,
      })),
    );

  const desdeDb = registradas.map((a) => {
    const cita = citas.find((c) => c.id === a.citaId);
    return {
      id: a.id,
      citaId: a.citaId,
      tipo: a.tipo,
      titulo: a.titulo,
      descripcion: a.descripcion,
      datos: parseJson<unknown>(a.datos),
      createdAt: a.createdAt,
      placa: cita?.placa ?? null,
      servicio: cita?.servicio?.titulo ?? null,
    };
  });

  return [...desdeDb, ...sinteticas].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export function actividadPublica(actividad: {
  id: string;
  citaId: string;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  datos: unknown;
  createdAt: Date;
  placa: string | null;
  servicio: string | null;
}) {
  return {
    id: actividad.id,
    citaId: actividad.citaId,
    tipo: actividad.tipo,
    titulo: actividad.titulo,
    descripcion: actividad.descripcion,
    datos: actividad.datos,
    placa: actividad.placa,
    servicio: actividad.servicio,
    createdAt: actividad.createdAt.toISOString(),
  };
}
