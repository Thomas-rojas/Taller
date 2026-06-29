import { normalizarTelefonoWhatsApp } from "./whatsappCloud.js";

function greenApiUrl() {
  return (process.env.GREEN_API_URL ?? "https://api.greenapi.com").replace(/\/$/, "");
}

export function greenApiConfigurado() {
  return Boolean(process.env.GREEN_API_INSTANCE_ID?.trim() && process.env.GREEN_API_TOKEN?.trim());
}

export async function enviarGreenApi(telefono: string, mensaje: string) {
  const instanceId = process.env.GREEN_API_INSTANCE_ID?.trim();
  const token = process.env.GREEN_API_TOKEN?.trim();
  if (!instanceId || !token) {
    throw new Error("Green API no configurada.");
  }

  const to = normalizarTelefonoWhatsApp(telefono);
  if (to.length < 11) {
    throw new Error("Número de teléfono inválido para WhatsApp.");
  }

  const response = await fetch(
    `${greenApiUrl()}/waInstance${instanceId}/sendMessage/${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: `${to}@c.us`,
        message: mensaje,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Green API: ${errorBody}`);
  }

  const data = (await response.json()) as { idMessage?: string };
  if (!data.idMessage) {
    throw new Error("Green API no confirmó el envío del mensaje.");
  }
}
