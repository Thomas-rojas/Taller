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

export { TIMEZONE, DIAS_RETRASO_ENTREGA };
