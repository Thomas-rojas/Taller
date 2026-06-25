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

export { toISODate, fromISODate };
