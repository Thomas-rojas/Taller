export type FotoTrabajoItem = {
  id: string;
  file?: File | null;
  preview?: string | null;
};

export type ItemTrabajo = {
  parte: string;
  descripcion: string;
  /** @deprecated usar fotosViejos / fotosNuevos */
  foto?: string | null;
  fotosViejos?: string[];
  fotosNuevos?: string[];
};

export type ItemTrabajoForm = {
  parte: string;
  descripcion: string;
  fotosViejos: FotoTrabajoItem[];
  fotosNuevos: FotoTrabajoItem[];
};

export function crearFotoTrabajo(): FotoTrabajoItem {
  return { id: crypto.randomUUID() };
}

export function trabajoVacio(): ItemTrabajoForm {
  return { parte: "", descripcion: "", fotosViejos: [], fotosNuevos: [] };
}

function esItemTrabajo(item: unknown): item is ItemTrabajo {
  if (typeof item !== "object" || item === null) return false;
  const trabajo = item as ItemTrabajo;
  if (typeof trabajo.parte !== "string" || typeof trabajo.descripcion !== "string") {
    return false;
  }

  const fotoLegacy =
    trabajo.foto === undefined || trabajo.foto === null || typeof trabajo.foto === "string";
  const viejos =
    trabajo.fotosViejos === undefined ||
    (Array.isArray(trabajo.fotosViejos) &&
      trabajo.fotosViejos.every((f) => typeof f === "string"));
  const nuevos =
    trabajo.fotosNuevos === undefined ||
    (Array.isArray(trabajo.fotosNuevos) &&
      trabajo.fotosNuevos.every((f) => typeof f === "string"));

  return fotoLegacy && viejos && nuevos;
}

export function fotosViejosDeTrabajo(trabajo: ItemTrabajo): string[] {
  if (trabajo.fotosViejos?.length) return trabajo.fotosViejos;
  if (trabajo.foto) return [trabajo.foto];
  return [];
}

export function fotosNuevosDeTrabajo(trabajo: ItemTrabajo): string[] {
  return trabajo.fotosNuevos ?? [];
}

export function parsearTrabajos(raw: string | null | undefined): ItemTrabajo[] | null {
  if (!raw?.trim()) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (Array.isArray(data) && data.length > 0 && data.every(esItemTrabajo)) {
      return data;
    }
  } catch {
    /* texto anterior sin formato */
  }
  return null;
}

export function liberarPreviewsTrabajo(trabajo: ItemTrabajoForm) {
  for (const foto of [...trabajo.fotosViejos, ...trabajo.fotosNuevos]) {
    if (foto.preview) URL.revokeObjectURL(foto.preview);
  }
}
