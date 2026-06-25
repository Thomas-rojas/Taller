const TIMEZONE = "America/Bogota";
const DIAS_RETRASO_ENTREGA = 7;

export function calcularFechaEntrega(fechaCita: Date) {
  const fechaEntrega = new Date(fechaCita);
  fechaEntrega.setDate(fechaEntrega.getDate() + DIAS_RETRASO_ENTREGA);
  return fechaEntrega;
}

export function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-CO", {
    timeZone: TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function aFechaCalendario(fecha: Date) {
  return fecha.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

export function diaSiguiente(fechaISO: string) {
  const fecha = new Date(`${fechaISO}T12:00:00`);
  fecha.setDate(fecha.getDate() + 1);
  return aFechaCalendario(fecha);
}

/** Genera todas las fechas (YYYY-MM-DD) desde fechaInicio hasta el fin de ese mes. */
export function generarFechasHastaFinDeMes(fechaInicio: Date): string[] {
  const baseISO = aFechaCalendario(fechaInicio);
  const [anio, mes, dia] = baseISO.split("-").map(Number);
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const fechas: string[] = [];

  for (let d = dia; d <= ultimoDia; d++) {
    fechas.push(aFechaCalendario(new Date(anio, mes - 1, d)));
  }

  return fechas;
}

/** @deprecated Usar generarFechasHastaFinDeMes */
export function generarFechasBloqueadas(fechaInicio: Date): string[] {
  return generarFechasHastaFinDeMes(fechaInicio);
}

export function esDomingo(fecha: Date): boolean {
  const iso = aFechaCalendario(fecha);
  return new Date(`${iso}T12:00:00`).getDay() === 0;
}

export { TIMEZONE, DIAS_RETRASO_ENTREGA };
