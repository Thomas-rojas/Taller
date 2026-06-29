export function whatsappCloudConfigurado() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export function normalizarTelefonoWhatsApp(telefono: string) {
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.startsWith("57") && digitos.length === 12) return digitos;
  if (digitos.length === 10 && digitos.startsWith("3")) return `57${digitos}`;
  if (digitos.length === 11 && digitos.startsWith("57")) return digitos;
  return digitos;
}

type ParametroPlantilla = { type: "text"; text: string };

async function enviarPeticionWhatsAppCloud(body: Record<string, unknown>) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    throw new Error("WhatsApp Cloud API no configurada.");
  }

  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp API: ${errorBody}`);
  }
}

export async function enviarWhatsAppCloudTexto(telefono: string, mensaje: string) {
  const to = normalizarTelefonoWhatsApp(telefono);
  if (to.length < 11) {
    throw new Error("Número de teléfono inválido para WhatsApp.");
  }

  await enviarPeticionWhatsAppCloud({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: mensaje },
  });
}

export async function enviarWhatsAppCloudPlantilla(
  telefono: string,
  parametros: string[],
) {
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  if (!templateName) {
    throw new Error("WHATSAPP_TEMPLATE_NAME no configurada.");
  }

  const to = normalizarTelefonoWhatsApp(telefono);
  if (to.length < 11) {
    throw new Error("Número de teléfono inválido para WhatsApp.");
  }

  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "es";

  await enviarPeticionWhatsAppCloud({
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components: [
        {
          type: "body",
          parameters: parametros.map((text): ParametroPlantilla => ({ type: "text", text })),
        },
      ],
    },
  });
}

export async function enviarWhatsAppCloudConfirmacion(
  telefono: string,
  parametrosPlantilla: string[],
  mensajeTexto: string,
) {
  if (process.env.WHATSAPP_TEMPLATE_NAME) {
    await enviarWhatsAppCloudPlantilla(telefono, parametrosPlantilla);
    return;
  }

  await enviarWhatsAppCloudTexto(telefono, mensajeTexto);
}
