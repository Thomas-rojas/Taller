// Vacío = usa el proxy de Next.js (/api → backend en :4000)
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const details = data.details as Record<string, string[] | undefined> | undefined;
    const primerDetalle = details
      ? Object.values(details).flat().find(Boolean)
      : undefined;
    throw new Error(primerDetalle ?? data.error ?? "Error en la solicitud");
  }

  return data as T;
}

export type Servicio = {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
};

export type GaleriaItem = {
  id: string;
  src: string;
  alt: string;
  titulo: string;
  descripcion: string;
  size: string;
};

export type ConfigTaller = {
  whatsapp: string;
  telefono: string;
  direccion: string;
  horario: string | null;
};

export type Faq = {
  id: string;
  pregunta: string;
};

export const api = {
  getServicios: () => request<Servicio[]>("/api/servicios"),
  getGaleria: () => request<GaleriaItem[]>("/api/galeria"),
  getConfig: () => request<ConfigTaller>("/api/config"),
  getFaqs: () => request<Faq[]>("/api/chat/faqs"),
  enviarMensaje: (mensaje: string) =>
    request<{ mensaje: string; respuesta: string }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ mensaje }),
    }),
  crearCita: (data: {
    nombre: string;
    telefono: string;
    email?: string;
    mensaje?: string;
    fechaPreferida?: string;
    servicioId?: string;
  }) =>
    request<{
      message: string;
      calendarSync?: { synced: boolean; error?: string; fechaEntrega?: string };
    }>("/api/citas", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
