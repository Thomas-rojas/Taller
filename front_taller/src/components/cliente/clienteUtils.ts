import type { CitaCliente } from "@/src/lib/api";

export type ClienteTab = "panel" | "historial" | "citas" | "taller" | "perfil";

export const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Cita confirmada",
  recibida: "En diagnóstico",
  finalizada: "Control de calidad",
  lista_retiro: "Lista para retirar",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

export const PROGRESO_ESTADO: Record<string, number> = {
  pendiente: 15,
  confirmada: 25,
  recibida: 45,
  finalizada: 70,
  lista_retiro: 90,
  entregada: 100,
  cancelada: 0,
};

const ACTIVOS = new Set(["pendiente", "confirmada", "recibida", "finalizada", "lista_retiro"]);
const FINALIZADOS = new Set(["entregada", "cancelada"]);

export function progresoServicio(estado: string) {
  return PROGRESO_ESTADO[estado] ?? 20;
}

export function etiquetaEstado(estado: string) {
  return ESTADO_LABEL[estado] ?? estado;
}

export function citaActiva(citas: CitaCliente[]) {
  return (
    citas.find((c) => ACTIVOS.has(c.estado)) ??
    citas.find((c) => !FINALIZADOS.has(c.estado)) ??
    null
  );
}

export function proximaCita(citas: CitaCliente[]) {
  const ahora = Date.now();
  const conFecha = citas
    .filter((c) => c.fechaPreferida && !FINALIZADOS.has(c.estado))
    .sort(
      (a, b) =>
        new Date(a.fechaPreferida!).getTime() - new Date(b.fechaPreferida!).getTime(),
    );

  const futura = conFecha.find((c) => new Date(c.fechaPreferida!).getTime() >= ahora);
  return futura ?? conFecha[0] ?? citas.find((c) => !FINALIZADOS.has(c.estado)) ?? null;
}

export function historialCitas(citas: CitaCliente[]) {
  return [...citas].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function tieneMotoEntregada(citas: CitaCliente[]) {
  return citas.some((c) => c.estado === "entregada");
}

export function tituloMoto(cita: CitaCliente) {
  if (cita.placa) return `Moto · ${cita.placa}`;
  return cita.servicio?.titulo ?? "Tu motocicleta";
}

export function formatearFechaRelativa(iso: string | null) {
  if (!iso) return "Por confirmar";
  const fecha = new Date(iso);
  const hoy = new Date();
  const manana = new Date();
  manana.setDate(hoy.getDate() + 1);

  const mismaFecha = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (mismaFecha(fecha, hoy)) return "Hoy";
  if (mismaFecha(fecha, manana)) return "Mañana";

  return fecha.toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export function formatearHora(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatearFechaCompleta(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function enlaceWhatsApp(numero: string, mensaje?: string) {
  const limpio = numero.replace(/\D/g, "");
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : "";
  return `https://wa.me/${limpio}${texto}`;
}
