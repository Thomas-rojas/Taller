export const CIERRE_ASESOR =
  "\n\nSi necesitas más información o atención personalizada, comunícate con un asesor a través del botón Contáctanos en la parte superior de la página.";

export function conCierre(respuesta: string) {
  if (respuesta.toLowerCase().includes("contáctanos")) {
    return respuesta;
  }
  return `${respuesta.trim()}${CIERRE_ASESOR}`;
}

export function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function coincide(mensaje: string, palabras: string[]) {
  const mensajeNorm = normalizar(mensaje);
  return palabras.some((palabra) => mensajeNorm.includes(normalizar(palabra)));
}
