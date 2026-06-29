function toISODate(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function esDomingo(iso: string): boolean {
  return fromISODate(iso).getDay() === 0;
}

export function hoyISO(): string {
  return toISODate(new Date());
}

export const HORA_APERTURA = 8;
export const HORA_CIERRE = 18;

export type HorarioLlegada = {
  value: string;
  label: string;
};

function formatoHora12(horas: number, minutos: number): string {
  const periodo = horas < 12 ? "a.m." : "p.m.";
  const horas12 = horas % 12 === 0 ? 12 : horas % 12;
  return `${horas12}:${String(minutos).padStart(2, "0")} ${periodo}`;
}

/** Horarios cada 30 min entre 8:00 a.m. y 6:00 p.m. (hora Colombia). */
export function generarHorariosLlegada(): HorarioLlegada[] {
  const horarios: HorarioLlegada[] = [];

  for (let horas = HORA_APERTURA; horas <= HORA_CIERRE; horas++) {
    for (const minutos of [0, 30]) {
      if (horas === HORA_CIERRE && minutos > 0) continue;

      const value = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
      horarios.push({ value, label: formatoHora12(horas, minutos) });
    }
  }

  return horarios;
}

export function horaDentroDeAtencion(horaHHmm: string): boolean {
  return generarHorariosLlegada().some((h) => h.value === horaHHmm);
}

/** Combina fecha YYYY-MM-DD y hora HH:mm en ISO con zona horaria de Bogotá. */
export function construirFechaHoraBogota(fechaISO: string, horaHHmm: string): string {
  return `${fechaISO}T${horaHHmm}:00-05:00`;
}

export function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export { toISODate, fromISODate };
