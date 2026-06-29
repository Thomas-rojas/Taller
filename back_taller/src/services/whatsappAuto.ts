import { enviarBaileys, baileysConectado, baileysHabilitado } from "./whatsappBaileys.js";
import { enviarGreenApi, greenApiConfigurado } from "./greenApi.js";
import {
  enviarWhatsAppCloudConfirmacion,
  whatsappCloudConfigurado,
} from "./whatsappCloud.js";

export type DatosWhatsAppConfirmacion = {
  telefono: string;
  mensaje: string;
  parametrosPlantilla: string[];
};

export function whatsappAutomaticoConfigurado() {
  return greenApiConfigurado() || whatsappCloudConfigurado() || baileysConectado();
}

export function whatsappAutomaticoHabilitado() {
  return (
    greenApiConfigurado() ||
    whatsappCloudConfigurado() ||
    process.env.WHATSAPP_BAILEYS !== "false"
  );
}

export type ResultadoNotificacionCanal = {
  correoEnviado: boolean;
  correoError?: string;
  whatsappEnviado: boolean;
  whatsappError?: string;
};

export function evaluarNotificacionCliente(
  tieneEmail: boolean,
  tieneTelefono: boolean,
  notificacion: ResultadoNotificacionCanal,
): boolean {
  const canales: boolean[] = [];
  if (tieneEmail) canales.push(notificacion.correoEnviado);
  if (tieneTelefono && whatsappAutomaticoHabilitado()) {
    canales.push(notificacion.whatsappEnviado);
  }
  if (canales.length === 0) return true;
  return canales.some(Boolean);
}

export function erroresNotificacionCliente(
  tieneEmail: boolean,
  tieneTelefono: boolean,
  notificacion: ResultadoNotificacionCanal,
): string[] {
  const errores: string[] = [];
  if (tieneEmail && !notificacion.correoEnviado) {
    errores.push(notificacion.correoError ?? "No se pudo enviar el correo.");
  }
  if (
    tieneTelefono &&
    whatsappAutomaticoHabilitado() &&
    !notificacion.whatsappEnviado
  ) {
    errores.push(notificacion.whatsappError ?? "No se pudo enviar el WhatsApp.");
  }
  return errores;
}

export function obtenerProveedorWhatsApp() {
  if (greenApiConfigurado()) return "green-api";
  if (whatsappCloudConfigurado()) return "meta-cloud";
  if (baileysConectado()) return "whatsapp-web";
  return "ninguno";
}

export async function enviarWhatsAppAutomatico(
  datos: DatosWhatsAppConfirmacion,
): Promise<boolean> {
  if (greenApiConfigurado()) {
    await enviarGreenApi(datos.telefono, datos.mensaje);
    return true;
  }

  if (whatsappCloudConfigurado()) {
    await enviarWhatsAppCloudConfirmacion(
      datos.telefono,
      datos.parametrosPlantilla,
      datos.mensaje,
    );
    return true;
  }

  if (baileysHabilitado()) {
    if (!baileysConectado()) {
      throw new Error(
        "WhatsApp del taller no está conectado. Entra como administrador en /mecanico, escanea el QR y espera «Conectado».",
      );
    }
    await enviarBaileys(datos.telefono, datos.mensaje);
    return true;
  }

  return false;
}
