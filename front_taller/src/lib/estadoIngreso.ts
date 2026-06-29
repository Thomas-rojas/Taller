export type EstadoIngreso = {
  descripcion: string;
  fotos: string[];
  videos: string[];
};

export type MediaIngresoPreview = {
  file: File;
  preview: string;
  tipo: "foto" | "video";
};

export type RecepcionIngresoForm = {
  descripcion: string;
  medios: MediaIngresoPreview[];
};

export function recepcionVacia(): RecepcionIngresoForm {
  return { descripcion: "", medios: [] };
}

export function parsearEstadoIngreso(raw: string | null | undefined): EstadoIngreso | null {
  if (!raw?.trim()) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (
      typeof data === "object" &&
      data !== null &&
      typeof (data as EstadoIngreso).descripcion === "string" &&
      Array.isArray((data as EstadoIngreso).fotos) &&
      Array.isArray((data as EstadoIngreso).videos)
    ) {
      return data as EstadoIngreso;
    }
  } catch {
    /* texto anterior sin formato */
  }
  return { descripcion: raw, fotos: [], videos: [] };
}
