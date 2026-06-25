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

function mechanicRequest<T>(path: string, apiKey: string, options?: RequestInit) {
  return request<T>(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...options?.headers,
    },
  });
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

export type RecepcionCalendario = {
  fecha: string;
  nombre: string;
  citaId: string;
};

export type Cita = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  mensaje: string | null;
  placa: string | null;
  descripcionTrabajo: string | null;
  datosReparacionBloqueados: boolean;
  registradoPor: string | null;
  fechaPreferida: string | null;
  fechaRecepcion: string | null;
  fechaEntrega: string | null;
  fechaEntregaReal: string | null;
  estado: string;
  servicio: Servicio | null;
};

export const api = {
  getServicios: () => request<Servicio[]>("/api/servicios"),
  getGaleria: () => request<GaleriaItem[]>("/api/galeria"),
  getConfig: () => request<ConfigTaller>("/api/config"),
  getFaqs: () => request<Faq[]>("/api/chat/faqs"),
  getCalendarioDisponibilidad: () =>
    request<{ fechas: string[]; recepciones: RecepcionCalendario[] }>(
      "/api/citas/fechas-bloqueadas",
    ),
  getFechasBloqueadas: () =>
    request<{ fechas: string[]; recepciones: RecepcionCalendario[] }>(
      "/api/citas/fechas-bloqueadas",
    ),
  getCitas: (apiKey: string) => mechanicRequest<Cita[]>("/api/citas", apiKey),
  recibirMoto: (
    apiKey: string,
    citaId: string,
    data: { placa: string; descripcionTrabajo: string; fechaRecepcion?: string },
  ) =>
    mechanicRequest<{ message: string; cita: Cita }>(`/api/citas/${citaId}/recibir`, apiKey, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  entregarMoto: (apiKey: string, citaId: string, fechaEntrega: string) =>
    mechanicRequest<{
      message: string;
      cita: Cita;
      periodoOcupado: { desde: string; hasta: string };
      diasLiberados: number;
      fechasBloqueadas: string[];
    }>(`/api/citas/${citaId}/entregar`, apiKey, {
        method: "POST",
        body: JSON.stringify({ fechaEntrega }),
      },
    ),
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
