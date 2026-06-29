import type { Cita, Servicio } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { crearTransportador, smtpConfigurado } from "./emailMecanico.js";
import {
  enviarWhatsAppAutomatico,
  whatsappAutomaticoHabilitado,
} from "./whatsappAuto.js";
import { obtenerConfigTaller } from "./notificacionCita.js";

type CitaConServicio = Cita & { servicio: Servicio | null };

export async function nombreMecanicoRegistro(registradoPor: string | null) {
  if (!registradoPor) return "Sin asignar";
  if (registradoPor === "mecanico") return "Mecánico (acceso legacy)";
  const mecanico = await prisma.mecanico.findUnique({
    where: { id: registradoPor },
    select: { nombre: true, apellidos: true },
  });
  if (!mecanico) return "Mecánico";
  return `${mecanico.nombre} ${mecanico.apellidos}`;
}

function emailAdmin() {
  return process.env.ADMIN_NOTIFY_EMAIL?.trim() || process.env.SMTP_USER?.trim() || null;
}

function telefonoAdmin(fallback: string) {
  return process.env.ADMIN_NOTIFY_PHONE?.trim() || fallback;
}

export async function notificarAdminTrabajoFinalizado(
  cita: CitaConServicio,
  nombreMecanico: string,
) {
  const taller = await obtenerConfigTaller();
  const servicio = cita.servicio?.titulo ? `\nServicio: ${cita.servicio.titulo}` : "";

  const mensaje = `Trabajo finalizado en Moto Taller Familiar.

Cliente: ${cita.nombre}
Teléfono: ${cita.telefono}
Placa: ${cita.placa ?? "—"}${servicio}
Mecánico: ${nombreMecanico}

La moto está en control de calidad. Revisa los datos en el panel y avisa al cliente cuando pueda retirarla.`;

  let correoEnviado = false;
  let correoError: string | undefined;
  let whatsappEnviado = false;
  let whatsappError: string | undefined;

  const destinoEmail = emailAdmin();
  if (destinoEmail && smtpConfigurado()) {
    try {
      const transporter = crearTransportador();
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: destinoEmail,
        subject: `Trabajo finalizado — ${cita.nombre} (${cita.placa ?? "sin placa"})`,
        text: mensaje,
        html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${mensaje}</pre>`,
      });
      correoEnviado = true;
    } catch (error) {
      correoError =
        error instanceof Error ? error.message : "No se pudo enviar el correo al administrador.";
    }
  }

  const destinoTelefono = telefonoAdmin(taller.whatsapp);
  if (whatsappAutomaticoHabilitado()) {
    try {
      whatsappEnviado = await enviarWhatsAppAutomatico({
        telefono: destinoTelefono,
        mensaje,
        parametrosPlantilla: [cita.nombre, cita.placa ?? "—", nombreMecanico, taller.direccion],
      });
    } catch (error) {
      whatsappError =
        error instanceof Error ? error.message : "No se pudo enviar WhatsApp al administrador.";
    }
  }

  return { correoEnviado, correoError, whatsappEnviado, whatsappError };
}

export async function notificarClienteCalidadEnRevision(cita: CitaConServicio) {
  const taller = await obtenerConfigTaller();
  const servicio = cita.servicio?.titulo ? ` Servicio: ${cita.servicio.titulo}.` : "";
  const placa = cita.placa ? ` Placa: ${cita.placa}.` : "";

  const mensajeWhatsApp = `Hola ${cita.nombre}, tu moto en Moto Taller Familiar ya terminó el servicio y se está pasando por control de calidad.${servicio}${placa} Te avisaremos cuando esté lista para retirar. Dirección: ${taller.direccion}. Teléfono: ${taller.telefono}.`;

  const mensajeCorreo = `Hola ${cita.nombre},

Tu moto en Moto Taller Familiar ya terminó el servicio y se está pasando por control de calidad.${servicio}${placa}

Te avisaremos cuando esté lista para retirar.

Dirección: ${taller.direccion}
Teléfono: ${taller.telefono}
WhatsApp: ${taller.whatsapp}

Moto Taller Familiar`;

  let correoEnviado = false;
  let correoError: string | undefined;
  let whatsappEnviado = false;
  let whatsappError: string | undefined;

  if (cita.email?.trim() && smtpConfigurado()) {
    try {
      const transporter = crearTransportador();
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: cita.email.trim(),
        subject: "Tu moto está en control de calidad — Moto Taller Familiar",
        text: mensajeCorreo,
        html: `<p>Hola <strong>${cita.nombre}</strong>,</p>
<p>Tu moto en <strong>Moto Taller Familiar</strong> ya terminó el servicio y se está pasando por <strong>control de calidad</strong>.${servicio ? ` ${servicio.trim()}` : ""}${placa ? ` ${placa.trim()}` : ""}</p>
<p>Te avisaremos cuando esté lista para retirar.</p>
<p><strong>Dirección:</strong> ${taller.direccion}<br>
<strong>Teléfono:</strong> ${taller.telefono}<br>
<strong>WhatsApp:</strong> ${taller.whatsapp}</p>`,
      });
      correoEnviado = true;
    } catch (error) {
      correoError =
        error instanceof Error ? error.message : "No se pudo enviar el correo al cliente.";
    }
  }

  if (cita.telefono?.trim() && whatsappAutomaticoHabilitado()) {
    try {
      whatsappEnviado = await enviarWhatsAppAutomatico({
        telefono: cita.telefono,
        mensaje: mensajeWhatsApp,
        parametrosPlantilla: [cita.nombre, cita.placa ?? " ", taller.direccion],
      });
    } catch (error) {
      whatsappError =
        error instanceof Error ? error.message : "No se pudo enviar WhatsApp al cliente.";
    }
  }

  return { correoEnviado, correoError, whatsappEnviado, whatsappError, mensaje: mensajeWhatsApp };
}

export async function notificarClienteListaRetiro(cita: CitaConServicio) {
  const taller = await obtenerConfigTaller();
  const servicio = cita.servicio?.titulo ? ` Servicio: ${cita.servicio.titulo}.` : "";

  const mensajeWhatsApp = `Hola ${cita.nombre}, tu moto en Moto Taller Familiar ya está lista para retirar.${servicio} Puedes pasar por el taller en ${taller.direccion}. Teléfono: ${taller.telefono}. ¡Te esperamos!`;

  const mensajeCorreo = `Hola ${cita.nombre},

Tu moto en Moto Taller Familiar ya está lista para retirar.${servicio}

Dirección: ${taller.direccion}
Teléfono: ${taller.telefono}
WhatsApp: ${taller.whatsapp}

¡Te esperamos!
Moto Taller Familiar`;

  let correoEnviado = false;
  let correoError: string | undefined;
  let whatsappEnviado = false;
  let whatsappError: string | undefined;

  if (cita.email?.trim() && smtpConfigurado()) {
    try {
      const transporter = crearTransportador();
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: cita.email.trim(),
        subject: "Tu moto está lista — Moto Taller Familiar",
        text: mensajeCorreo,
        html: `<p>Hola <strong>${cita.nombre}</strong>,</p>
<p>Tu moto en <strong>Moto Taller Familiar</strong> ya está lista para retirar.${servicio ? ` ${servicio.trim()}` : ""}</p>
<p><strong>Dirección:</strong> ${taller.direccion}<br>
<strong>Teléfono:</strong> ${taller.telefono}<br>
<strong>WhatsApp:</strong> ${taller.whatsapp}</p>
<p>¡Te esperamos!</p>`,
      });
      correoEnviado = true;
    } catch (error) {
      correoError =
        error instanceof Error ? error.message : "No se pudo enviar el correo al cliente.";
    }
  }

  if (cita.telefono?.trim() && whatsappAutomaticoHabilitado()) {
    try {
      whatsappEnviado = await enviarWhatsAppAutomatico({
        telefono: cita.telefono,
        mensaje: mensajeWhatsApp,
        parametrosPlantilla: [cita.nombre, cita.placa ?? " ", taller.direccion],
      });
    } catch (error) {
      whatsappError =
        error instanceof Error ? error.message : "No se pudo enviar WhatsApp al cliente.";
    }
  }

  return { correoEnviado, correoError, whatsappEnviado, whatsappError, mensaje: mensajeWhatsApp };
}
