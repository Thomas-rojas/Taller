import type { Cita, Servicio } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { aFechaCalendario, formatearFecha, formatearFechaHora } from "../lib/fechas.js";
import { crearTransportador, smtpConfigurado } from "./emailMecanico.js";
import {
  enviarWhatsAppAutomatico,
  whatsappAutomaticoHabilitado,
} from "./whatsappAuto.js";
import { normalizarTelefonoWhatsApp } from "./whatsappCloud.js";

type CitaConServicio = Cita & { servicio: Servicio | null };

type DatosTaller = {
  direccion: string;
  telefono: string;
  whatsapp: string;
};

export async function obtenerConfigTaller(): Promise<DatosTaller> {
  const config = await prisma.configuracion.findUnique({ where: { id: "default" } });
  return {
    direccion: config?.direccion ?? "Calle 92sur #4a-29, Barrio el virrey",
    telefono: config?.telefono ?? "+57 322 680 7105",
    whatsapp: config?.whatsapp ?? "+57 314 490 2016",
  };
}

export async function contarSolicitudesDelDia(fechaPreferida: Date) {
  const fechaISO = aFechaCalendario(fechaPreferida);
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const inicio = new Date(anio, mes - 1, dia, 0, 0, 0, 0);
  const fin = new Date(anio, mes - 1, dia, 23, 59, 59, 999);

  return prisma.cita.count({
    where: {
      estado: { not: "cancelada" },
      fechaPreferida: { gte: inicio, lte: fin },
    },
  });
}

function textoSolicitudesDelDia(total: number) {
  if (total >= 2) {
    return `Ese día tenemos ${total} citas agendadas, incluida la tuya. Es importante que lleves tu moto ese día.`;
  }
  return "Es importante que lleves tu moto el día de tu cita.";
}

export function construirMensajeConfirmacion(
  cita: CitaConServicio,
  solicitudesDia: number,
  taller: DatosTaller,
) {
  const fechaTexto = cita.fechaPreferida
    ? formatearFechaHora(cita.fechaPreferida)
    : "la fecha acordada con el taller";
  const servicio = cita.servicio?.titulo ? `\nServicio: ${cita.servicio.titulo}` : "";

  return `Hola ${cita.nombre},

Tu cita en Moto Taller Familiar fue confirmada para el ${fechaTexto}.${servicio}

Por favor lleva tu moto ese día. ${textoSolicitudesDelDia(solicitudesDia)}

Dirección: ${taller.direccion}
Teléfono: ${taller.telefono}
WhatsApp: ${taller.whatsapp}

¡Te esperamos!
Moto Taller Familiar`;
}

export function construirMensajeWhatsAppCorto(
  cita: CitaConServicio,
  solicitudesDia: number,
  taller: DatosTaller,
) {
  const fechaTexto = cita.fechaPreferida
    ? formatearFechaHora(cita.fechaPreferida)
    : "la fecha acordada";
  const servicio = cita.servicio?.titulo ? ` Servicio: ${cita.servicio.titulo}.` : "";
  const avisoDia =
    solicitudesDia >= 2
      ? ` Ese día hay ${solicitudesDia} citas agendadas, incluida la tuya.`
      : "";

  return `Hola ${cita.nombre}, tu cita en Moto Taller Familiar quedó confirmada para el ${fechaTexto}.${servicio}${avisoDia} Por favor lleva tu moto ese día. Dirección: ${taller.direccion}. ¡Te esperamos!`;
}

export function construirDetalleWhatsApp(
  cita: CitaConServicio,
  solicitudesDia: number,
) {
  const partes: string[] = [];
  if (cita.servicio?.titulo) {
    partes.push(`Servicio: ${cita.servicio.titulo}.`);
  }
  if (solicitudesDia >= 2) {
    partes.push(`Ese día hay ${solicitudesDia} citas agendadas, incluida la tuya.`);
  }
  return partes.join(" ");
}

export function construirParametrosPlantillaWhatsApp(
  cita: CitaConServicio,
  solicitudesDia: number,
  taller: DatosTaller,
) {
  const fechaTexto = cita.fechaPreferida
    ? formatearFechaHora(cita.fechaPreferida)
    : "la fecha acordada";
  const detalle = construirDetalleWhatsApp(cita, solicitudesDia);

  return [cita.nombre, fechaTexto, detalle || " ", taller.direccion];
}

function plantillaCorreoConfirmacion(
  cita: CitaConServicio,
  solicitudesDia: number,
  taller: DatosTaller,
) {
  const fechaTexto = cita.fechaPreferida
    ? formatearFechaHora(cita.fechaPreferida)
    : "la fecha acordada con el taller";
  const servicio = cita.servicio?.titulo
    ? `<tr><td style="padding: 8px 0; color: #737373;">Servicio</td><td style="padding: 8px 0;">${cita.servicio.titulo}</td></tr>`
    : "";
  const avisoDia = textoSolicitudesDelDia(solicitudesDia);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color: #111; line-height: 1.6; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #e8774a; font-size: 22px;">Tu cita fue confirmada</h1>
  <p>Hola <strong>${cita.nombre}</strong>,</p>
  <p>Tu cita en <strong>Moto Taller Familiar</strong> fue aceptada. Por favor lleva tu moto el día acordado.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px 0; color: #737373;">Fecha</td><td style="padding: 8px 0;"><strong>${fechaTexto}</strong></td></tr>
    ${servicio}
  </table>
  <p>${avisoDia}</p>
  <p><strong>Dirección:</strong> ${taller.direccion}<br>
  <strong>Teléfono:</strong> ${taller.telefono}<br>
  <strong>WhatsApp:</strong> ${taller.whatsapp}</p>
  <p style="margin-top: 32px; color: #737373; font-size: 13px;">Moto Taller Familiar — Garantía, servicio y confianza.</p>
</body>
</html>`;

  const text = construirMensajeConfirmacion(cita, solicitudesDia, taller);

  return {
    html,
    text,
    subject: `Cita confirmada — Moto Taller Familiar (${fechaTexto})`,
  };
}

export async function enviarCorreoConfirmacionCita(
  cita: CitaConServicio,
  solicitudesDia: number,
  taller: DatosTaller,
) {
  if (!cita.email?.trim()) return false;
  if (!smtpConfigurado()) {
    throw new Error("Correo no configurado en el servidor.");
  }

  const transporter = crearTransportador();
  const { html, text, subject } = plantillaCorreoConfirmacion(cita, solicitudesDia, taller);

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: cita.email.trim(),
    subject,
    text,
    html,
  });

  return true;
}

export async function notificarClienteCitaConfirmada(cita: CitaConServicio) {
  const taller = await obtenerConfigTaller();
  const solicitudesDia = cita.fechaPreferida
    ? await contarSolicitudesDelDia(cita.fechaPreferida)
    : 1;
  const mensaje = construirMensajeConfirmacion(cita, solicitudesDia, taller);
  const mensajeWhatsApp = construirMensajeWhatsAppCorto(cita, solicitudesDia, taller);

  let correoEnviado = false;
  let correoError: string | undefined;
  let whatsappEnviado = false;
  let whatsappError: string | undefined;

  if (cita.email?.trim()) {
    try {
      correoEnviado = await enviarCorreoConfirmacionCita(cita, solicitudesDia, taller);
    } catch (error) {
      correoError =
        error instanceof Error ? error.message : "No se pudo enviar el correo al cliente.";
    }
  }

  if (cita.telefono?.trim() && whatsappAutomaticoHabilitado()) {
    const numero = normalizarTelefonoWhatsApp(cita.telefono);
    if (numero.length < 11) {
      whatsappError = "El teléfono del cliente no es válido para WhatsApp.";
    } else {
      try {
        const enviado = await enviarWhatsAppAutomatico({
          telefono: cita.telefono,
          mensaje: mensajeWhatsApp,
          parametrosPlantilla: construirParametrosPlantillaWhatsApp(
            cita,
            solicitudesDia,
            taller,
          ),
        });
        whatsappEnviado = enviado;
        if (enviado) {
          console.log(
            `[WhatsApp] Confirmación enviada a ${normalizarTelefonoWhatsApp(cita.telefono)}`,
          );
        }
      } catch (error) {
        whatsappError =
          error instanceof Error ? error.message : "No se pudo enviar el WhatsApp automático.";
      }
    }
  }

  return {
    correoEnviado,
    correoError,
    whatsappEnviado,
    whatsappError,
    mensaje: mensajeWhatsApp,
  };
}
