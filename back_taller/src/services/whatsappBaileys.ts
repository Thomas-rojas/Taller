import path from "path";
import fs from "fs";
import os from "os";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import pkg from "whatsapp-web.js";
import { normalizarTelefonoWhatsApp, whatsappCloudConfigurado } from "./whatsappCloud.js";
import { greenApiConfigurado } from "./greenApi.js";

if (!process.env.PUPPETEER_CACHE_DIR) {
  process.env.PUPPETEER_CACHE_DIR = path.join(os.homedir(), ".cache", "moto-taller-puppeteer");
}

const { Client, LocalAuth } = pkg;

const LOCK_FILES = new Set([
  "SingletonLock",
  "SingletonCookie",
  "SingletonSocket",
  "lockfile",
  "DevToolsActivePort",
]);

function resolverAuthDir() {
  const personalizado = process.env.WHATSAPP_AUTH_DIR?.trim();
  if (personalizado) return path.resolve(personalizado);
  return path.join(os.homedir(), ".moto-taller-whatsapp");
}

function migrarSesionLegacy(destino: string) {
  const legacy = path.join(process.cwd(), ".whatsapp-auth");
  const legacySession = path.join(legacy, "session");
  const nuevaSession = path.join(destino, "session");
  if (fs.existsSync(nuevaSession) || !fs.existsSync(legacySession)) return;

  try {
    fs.cpSync(legacy, destino, { recursive: true });
    console.log(`[WhatsApp] Sesión migrada a ${destino}`);
  } catch {
    console.warn("[WhatsApp] No se pudo migrar la sesión anterior; puede que debas escanear el QR otra vez.");
  }
}

const AUTH_DIR = (() => {
  const dir = resolverAuthDir();
  fs.mkdirSync(dir, { recursive: true });
  migrarSesionLegacy(dir);
  return dir;
})();

let client: InstanceType<typeof Client> | null = null;
let conectado = false;
let ultimoQrDataUrl: string | null = null;
let iniciando = false;
let intentosReconexion = 0;

export function baileysHabilitado() {
  if (process.env.WHATSAPP_BAILEYS === "false") return false;
  if (greenApiConfigurado() || whatsappCloudConfigurado()) return false;
  return true;
}

export function baileysConectado() {
  return baileysHabilitado() && conectado;
}

export async function obtenerEstadoBaileys() {
  return {
    habilitado: baileysHabilitado(),
    conectado: baileysConectado(),
    qrDisponible: Boolean(ultimoQrDataUrl),
    qrDataUrl: ultimoQrDataUrl,
    authDir: AUTH_DIR,
  };
}

async function destruirCliente() {
  if (!client) {
    iniciando = false;
    return;
  }
  try {
    await client.destroy();
  } catch {
    // Ignorar errores al cerrar el navegador embebido.
  }
  client = null;
  conectado = false;
  iniciando = false;
}

function limpiarBloqueoChrome() {
  const raices = [path.join(AUTH_DIR, "session"), AUTH_DIR];

  function recorrer(directorio: string) {
    if (!fs.existsSync(directorio)) return;
    for (const entrada of fs.readdirSync(directorio, { withFileTypes: true })) {
      const ruta = path.join(directorio, entrada.name);
      if (entrada.isDirectory()) {
        recorrer(ruta);
      } else if (LOCK_FILES.has(entrada.name)) {
        try {
          fs.unlinkSync(ruta);
        } catch {
          // Otro proceso puede tener el archivo abierto.
        }
      }
    }
  }

  for (const raiz of raices) recorrer(raiz);
}

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolverChrome() {
  const personalizado =
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim() || process.env.CHROME_PATH?.trim();
  if (personalizado && fs.existsSync(personalizado)) return personalizado;

  const rutasWindows = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(os.homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe"),
  ];
  for (const ruta of rutasWindows) {
    if (fs.existsSync(ruta)) return ruta;
  }

  try {
    const bundled = puppeteer.executablePath();
    if (fs.existsSync(bundled)) return bundled;
  } catch {
    // Puppeteer aún no descargó Chrome.
  }

  return undefined;
}

async function conectarWhatsAppWeb() {
  if (!baileysHabilitado()) return;
  if (iniciando) return;
  if (client && conectado) return;

  iniciando = true;

  try {
    if (client) {
      await destruirCliente();
    }

    limpiarBloqueoChrome();
    await esperar(500);

    const chromePath = resolverChrome();
    if (!chromePath) {
      throw new Error(
        "Chrome no encontrado. Ejecuta en back_taller: npm run whatsapp:setup",
      );
    }

    client = new Client({
      authStrategy: new LocalAuth({ dataPath: AUTH_DIR }),
      puppeteer: {
        headless: true,
        executablePath: chromePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      },
    });

    client.on("qr", async (qr: string) => {
      ultimoQrDataUrl = await QRCode.toDataURL(qr);
      console.log("\n[WhatsApp] Escanea el código QR en el panel /mecanico (admin).\n");
    });

    client.on("authenticated", () => {
      console.log("[WhatsApp] Sesión autenticada, conectando...");
    });

    client.on("ready", () => {
      conectado = true;
      ultimoQrDataUrl = null;
      iniciando = false;
      intentosReconexion = 0;
      console.log("[WhatsApp] Conectado y listo para enviar mensajes.");
    });

    client.on("auth_failure", (message: string) => {
      conectado = false;
      iniciando = false;
      console.error("[WhatsApp] Error de autenticación:", message);
    });

    client.on("disconnected", (reason: string) => {
      console.log("[WhatsApp] Desconectado:", reason);
      conectado = false;
      void destruirCliente().then(() => {
        if (intentosReconexion < 10) {
          intentosReconexion += 1;
          setTimeout(() => {
            void conectarWhatsAppWeb();
          }, 5000);
        }
      });
    });

    await client.initialize();
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error("[WhatsApp] No se pudo iniciar:", mensaje);
    iniciando = false;
    await destruirCliente();
    limpiarBloqueoChrome();

    if (mensaje.includes("browser is already running") && intentosReconexion < 8) {
      intentosReconexion += 1;
      console.log(`[WhatsApp] Reintentando conexión (${intentosReconexion}/8)...`);
      setTimeout(() => {
        void conectarWhatsAppWeb();
      }, 8000);
    }
  }
}

export function iniciarWhatsAppBaileys() {
  if (!baileysHabilitado()) return;
  console.log(`[WhatsApp] Modo QR activo. Sesión en: ${AUTH_DIR}`);
  void conectarWhatsAppWeb();
}

export async function enviarBaileys(telefono: string, mensaje: string) {
  if (!client || !conectado) {
    throw new Error(
      "WhatsApp del taller no está conectado. Entra como administrador en /mecanico, escanea el QR y espera «Conectado».",
    );
  }

  const numero = normalizarTelefonoWhatsApp(telefono);
  if (numero.length < 11) {
    throw new Error(`Teléfono inválido (${telefono}). Usa 10 dígitos, ej: 3001234567.`);
  }

  const contacto = await client.getNumberId(numero);
  if (!contacto) {
    throw new Error(
      `El número ${telefono} no está registrado en WhatsApp. Verifica que el cliente lo escribió bien.`,
    );
  }

  await client.sendMessage(contacto._serialized, mensaje);
  console.log(`[WhatsApp] Mensaje enviado a ${numero}`);
}

async function cerrarAlSalir() {
  limpiarBloqueoChrome();
  await destruirCliente();
}

process.on("SIGINT", () => {
  void cerrarAlSalir();
});

process.on("SIGTERM", () => {
  void cerrarAlSalir();
});

process.on("exit", () => {
  limpiarBloqueoChrome();
});
