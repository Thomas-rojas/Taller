import nodemailer from "nodemailer";
import type { Mecanico } from "@prisma/client";

const TIPO_IDENTIFICACION_LABEL: Record<string, string> = {
  cedula: "Cédula",
  pasaporte: "Pasaporte",
  cedula_extranjeria: "Cédula de extranjería",
  tarjeta_identidad: "Tarjeta de identidad",
};

export function smtpConfigurado() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM,
  );
}

export function crearTransportador() {
  if (!smtpConfigurado()) {
    throw new Error(
      "Correo no configurado. Define SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM en .env",
    );
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function plantillaConfirmacion(mecanico: Mecanico) {
  const tipoId =
    TIPO_IDENTIFICACION_LABEL[mecanico.tipoIdentificacion] ?? mecanico.tipoIdentificacion;
  const nombreCompleto = `${mecanico.nombre} ${mecanico.apellidos}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color: #111; line-height: 1.6; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #e8774a; font-size: 22px;">¡Bienvenido a Moto Taller Familiar!</h1>
  <p>Hola <strong>${nombreCompleto}</strong>,</p>
  <p>Recibimos tu solicitud de registro como mecánico. Estos son los datos que registraste:</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px 0; color: #737373;">Nombre</td><td style="padding: 8px 0;"><strong>${nombreCompleto}</strong></td></tr>
    <tr><td style="padding: 8px 0; color: #737373;">Correo</td><td style="padding: 8px 0;">${mecanico.email}</td></tr>
    <tr><td style="padding: 8px 0; color: #737373;">Celular</td><td style="padding: 8px 0;">${mecanico.celular}</td></tr>
    <tr><td style="padding: 8px 0; color: #737373;">Dirección de vivienda</td><td style="padding: 8px 0;">${mecanico.direccion}</td></tr>
    <tr><td style="padding: 8px 0; color: #737373;">Identificación</td><td style="padding: 8px 0;">${tipoId} — ${mecanico.identificacion}</td></tr>
  </table>
  <p>Un administrador revisará tu solicitud y te avisará cuando puedas ingresar al panel del mecánico.</p>
  <p style="margin-top: 32px; color: #737373; font-size: 13px;">Moto Taller Familiar — Garantía, servicio y confianza.</p>
</body>
</html>`;

  const text = `¡Bienvenido a Moto Taller Familiar!

Hola ${nombreCompleto},

Recibimos tu solicitud de registro como mecánico.

Datos registrados:
- Nombre: ${nombreCompleto}
- Correo: ${mecanico.email}
- Celular: ${mecanico.celular}
- Dirección de vivienda: ${mecanico.direccion}
- Identificación: ${tipoId} — ${mecanico.identificacion}

Un administrador revisará tu solicitud y te avisará cuando puedas ingresar al panel.

Moto Taller Familiar`;

  return { html, text, subject: "Bienvenido a Moto Taller — Registro recibido" };
}

export async function enviarCorreoConfirmacionMecanico(mecanico: Mecanico) {
  const transporter = crearTransportador();
  const { html, text, subject } = plantillaConfirmacion(mecanico);

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: mecanico.email,
    subject,
    text,
    html,
  });
}

export function correoMecanicoConfigurado() {
  return smtpConfigurado();
}
