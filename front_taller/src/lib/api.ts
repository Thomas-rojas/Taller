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

function mechanicFormRequest<T>(path: string, apiKey: string, formData: FormData): Promise<T> {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const details = data.details as Record<string, string[] | undefined> | undefined;
      const primerDetalle = details
        ? Object.values(details).flat().find(Boolean)
        : undefined;
      throw new Error(primerDetalle ?? data.error ?? "Error en la solicitud");
    }
    return data as T;
  });
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

function clienteRequest<T>(path: string, token: string, options?: RequestInit) {
  return request<T>(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

import type { ItemTrabajoForm } from "./trabajos";
import type { RecepcionIngresoForm } from "./estadoIngreso";

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
  estadoMotoIngreso: string | null;
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

export type Mecanico = {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  celular: string;
  direccion: string;
  tipoIdentificacion: string;
  identificacion: string;
  aprobado: boolean;
  activo: boolean;
  createdAt: string;
};

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  createdAt: string;
};

export type Testimonio = {
  id: string;
  nombre: string;
  moto: string;
  texto: string;
  publicado?: boolean;
  createdAt: string;
};

export type CitaCliente = {
  id: string;
  estado: string;
  nombre: string;
  placa: string | null;
  fechaPreferida: string | null;
  fechaRecepcion: string | null;
  fechaEntregaReal: string | null;
  servicio: { id: string; titulo: string } | null;
  createdAt: string;
};

export type NovedadMoto = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string | null;
  tipo: "noticia" | "lanzamiento" | "tip";
  url: string | null;
  fuente: string | null;
  createdAt: string;
};

export type ActividadCliente = {
  id: string;
  citaId: string;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  datos: {
    descripcion?: string;
    fotos?: string[];
    videos?: string[];
    parte?: string;
    fotosViejos?: string[];
    fotosNuevos?: string[];
    placa?: string | null;
    servicio?: string | null;
    enProgreso?: boolean;
  } | null;
  placa: string | null;
  servicio: string | null;
  createdAt: string;
};

export type ClienteFrecuente = {
  telefono: string;
  nombre: string;
  email: string | null;
  totalVisitas: number;
  ultimaVisita: string | null;
  ultimoServicio: string | null;
  placas: string[];
  frecuente: boolean;
};

export type HistorialTrabajo = {
  id: string;
  mecanicoId: string | null;
  mecanicoNombre: string;
  clienteNombre: string;
  telefono: string;
  placa: string | null;
  estadoMotoIngreso: string | null;
  descripcionTrabajo: string | null;
  servicio: string | null;
  estado: string;
  fechaRecepcion: string | null;
  fechaEntregaReal: string | null;
};

export type MecanicoConTrabajos = {
  id: string;
  nombre: string;
  totalTrabajos: number;
};

export type CitaPendienteRevision = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  placa: string | null;
  descripcionTrabajo: string | null;
  estadoMotoIngreso: string | null;
  servicio: string | null;
  fechaRecepcion: string | null;
  fechaEntregaReal: string | null;
  mecanicoNombre: string;
};

export const api = {
  getServicios: () => request<Servicio[]>("/api/servicios"),
  getGaleria: () => request<GaleriaItem[]>("/api/galeria"),
  getConfig: () => request<ConfigTaller>("/api/config"),
  getTestimonios: () => request<Testimonio[]>("/api/testimonios"),
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
  confirmarCita: (apiKey: string, citaId: string) =>
    mechanicRequest<{
      message: string;
      cita: Cita;
      notificacion: {
        correoEnviado: boolean;
        correoError?: string;
        whatsappEnviado: boolean;
        whatsappError?: string;
        mensaje: string;
      };
    }>(`/api/citas/${citaId}/confirmar`, apiKey, { method: "POST" }),
  reenviarConfirmacionCita: (apiKey: string, citaId: string) =>
    mechanicRequest<{
      message: string;
      cita: Cita;
      notificacion: {
        correoEnviado: boolean;
        correoError?: string;
        whatsappEnviado: boolean;
        whatsappError?: string;
        mensaje: string;
      };
    }>(`/api/citas/${citaId}/reenviar-confirmacion`, apiKey, { method: "POST" }),
  recibirMoto: (apiKey: string, citaId: string, data: RecepcionIngresoForm) => {
    const form = new FormData();
    form.append("estadoMotoIngreso", data.descripcion);
    data.medios
      .filter((m) => m.tipo === "foto")
      .forEach((m) => form.append("fotos", m.file));
    data.medios
      .filter((m) => m.tipo === "video")
      .forEach((m) => form.append("videos", m.file));
    return mechanicFormRequest<{ message: string; cita: Cita }>(
      `/api/citas/${citaId}/recibir`,
      apiKey,
      form,
    );
  },
  entregarMoto: (
    apiKey: string,
    citaId: string,
    data: { fechaEntrega: string; placa: string; trabajos: ItemTrabajoForm[] },
  ) => {
    const form = new FormData();
    form.append("fechaEntrega", data.fechaEntrega);
    form.append("placa", data.placa);
    form.append(
      "trabajos",
      JSON.stringify(
        data.trabajos.map((trabajo) => ({
          parte: trabajo.parte,
          descripcion: trabajo.descripcion,
          fotosViejos: trabajo.fotosViejos
            .map((foto) => foto.url)
            .filter((url): url is string => Boolean(url)),
          fotosNuevos: trabajo.fotosNuevos
            .map((foto) => foto.url)
            .filter((url): url is string => Boolean(url)),
        })),
      ),
    );
    data.trabajos.forEach((trabajo, index) => {
      trabajo.fotosViejos.forEach((foto) => {
        if (foto.file) form.append(`trabajo_${index}_viejo`, foto.file);
      });
      trabajo.fotosNuevos.forEach((foto) => {
        if (foto.file) form.append(`trabajo_${index}_nuevo`, foto.file);
      });
    });
    return mechanicFormRequest<{
      message: string;
      cita: Cita;
      periodoOcupado: { desde: string; hasta: string };
      diasLiberados: number;
      fechasBloqueadas: string[];
    }>(`/api/citas/${citaId}/entregar`, apiKey, form);
  },
  guardarTrabajoBorrador: (
    apiKey: string,
    citaId: string,
    data: { placa: string; trabajos: ItemTrabajoForm[] },
  ) => {
    const form = new FormData();
    if (data.placa.trim()) form.append("placa", data.placa.trim());
    form.append(
      "trabajos",
      JSON.stringify(
        data.trabajos.map((trabajo) => ({
          parte: trabajo.parte,
          descripcion: trabajo.descripcion,
          fotosViejos: trabajo.fotosViejos
            .map((foto) => foto.url)
            .filter((url): url is string => Boolean(url)),
          fotosNuevos: trabajo.fotosNuevos
            .map((foto) => foto.url)
            .filter((url): url is string => Boolean(url)),
        })),
      ),
    );
    data.trabajos.forEach((trabajo, index) => {
      trabajo.fotosViejos.forEach((foto) => {
        if (foto.file) form.append(`trabajo_${index}_viejo`, foto.file);
      });
      trabajo.fotosNuevos.forEach((foto) => {
        if (foto.file) form.append(`trabajo_${index}_nuevo`, foto.file);
      });
    });
    return mechanicFormRequest<{ message: string; cita: Cita }>(
      `/api/citas/${citaId}/trabajo-borrador`,
      apiKey,
      form,
    );
  },
  notificarRetiroCliente: (adminKey: string, citaId: string) =>
    mechanicRequest<{
      message: string;
      cita: Cita;
      notificacion: {
        correoEnviado: boolean;
        correoError?: string;
        whatsappEnviado: boolean;
        whatsappError?: string;
        mensaje: string;
      };
    }>(`/api/citas/${citaId}/notificar-retiro`, adminKey, { method: "POST" }),
  entregarMotoCliente: (apiKey: string, citaId: string) =>
    mechanicRequest<{ message: string; cita: Cita }>(
      `/api/citas/${citaId}/entregar-cliente`,
      apiKey,
      { method: "POST" },
    ),
  getMotosPendientesRevision: (adminKey: string) =>
    mechanicRequest<CitaPendienteRevision[]>("/api/admin/pendientes-revision", adminKey),
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
  registrarMecanico: (data: {
    email: string;
    nombre: string;
    apellidos: string;
    celular: string;
    direccion: string;
    tipoIdentificacion: string;
    identificacion: string;
  }) =>
    request<{
      message: string;
      mecanico: Mecanico;
      correoEnviado?: boolean;
      correoError?: string;
    }>("/api/mecanicos/registro", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  loginMecanico: (data: { email: string; identificacion: string }) =>
    request<{ message: string; token: string; mecanico: Mecanico }>("/api/mecanicos/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logoutMecanico: (token: string) =>
    mechanicRequest<{ message: string }>("/api/mecanicos/logout", token, { method: "POST" }),
  getPerfilMecanico: (token: string) =>
    mechanicRequest<{ tipo: string; rol?: string; mecanico?: Mecanico }>(
      "/api/mecanicos/me",
      token,
    ),
  getMecanicosPendientes: (adminKey: string) =>
    mechanicRequest<Mecanico[]>("/api/mecanicos/pendientes", adminKey),
  aprobarMecanico: (adminKey: string, id: string) =>
    mechanicRequest<{ message: string; mecanico: Mecanico }>(
      `/api/mecanicos/${id}/aprobar`,
      adminKey,
      { method: "POST" },
    ),
  rechazarMecanico: (adminKey: string, id: string) =>
    mechanicRequest<{ message: string }>(`/api/mecanicos/${id}/rechazar`, adminKey, {
      method: "POST",
    }),
  getClientesFrecuentes: (adminKey: string) =>
    mechanicRequest<ClienteFrecuente[]>("/api/admin/clientes-frecuentes", adminKey),
  getHistorialMecanicos: (adminKey: string, mecanicoId?: string) => {
    const query = mecanicoId ? `?mecanicoId=${encodeURIComponent(mecanicoId)}` : "";
    return mechanicRequest<{
      historial: HistorialTrabajo[];
      mecanicos: MecanicoConTrabajos[];
    }>(`/api/admin/historial-mecanicos${query}`, adminKey);
  },
  getWhatsAppEstado: (adminKey: string) =>
    mechanicRequest<{
      proveedor: "green-api" | "meta-cloud" | "whatsapp-web" | "ninguno";
      greenApiConfigurado: boolean;
      automaticoHabilitado: boolean;
      habilitado: boolean;
      conectado: boolean;
      qrDisponible: boolean;
      qrDataUrl: string | null;
    }>("/api/admin/whatsapp-estado", adminKey),
  registrarCliente: (data: {
    nombre: string;
    telefono: string;
    email: string;
    password: string;
  }) =>
    request<{ message: string; token: string; cliente: Cliente }>("/api/clientes/registro", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  loginCliente: (data: { email: string; password: string }) =>
    request<{ message: string; token: string; cliente: Cliente }>("/api/clientes/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logoutCliente: (token: string) =>
    clienteRequest<{ message: string }>("/api/clientes/logout", token, { method: "POST" }),
  getPerfilCliente: (token: string) =>
    clienteRequest<{ cliente: Cliente }>("/api/clientes/me", token),
  getMisCitasCliente: (token: string) =>
    clienteRequest<CitaCliente[]>("/api/clientes/mis-citas", token),
  getActividadCliente: (token: string) =>
    clienteRequest<ActividadCliente[]>("/api/clientes/actividad", token),
  getNovedadesCliente: (token: string) =>
    clienteRequest<NovedadMoto[]>("/api/clientes/novedades", token),
  reservarCitaCliente: (
    token: string,
    data: { mensaje?: string; fechaPreferida: string; servicioId?: string },
  ) =>
    clienteRequest<{
      message: string;
      cita: {
        id: string;
        estado: string;
        fechaPreferida: string | null;
        servicio: { id: string; titulo: string } | null;
      };
      calendarSync?: { synced: boolean; error?: string };
    }>("/api/clientes/reservar-cita", token, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMiTestimonioCliente: (token: string) =>
    clienteRequest<{ testimonio: Testimonio | null }>("/api/clientes/mi-testimonio", token),
  publicarTestimonioCliente: (token: string, data: { moto: string; texto: string }) =>
    clienteRequest<{ message: string; testimonio: Testimonio }>("/api/clientes/testimonio", token, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
