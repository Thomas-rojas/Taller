import "dotenv/config";
import http from "node:http";
import { spawn } from "node:child_process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { google } from "googleapis";
import { getEnvValue, updateEnvFile } from "./lib/updateEnv.js";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const SETUP_PORT = 4010;
const SETUP_REDIRECT_URI = `http://localhost:${SETUP_PORT}/oauth2callback`;
const BACKEND_REDIRECT_URI = "http://localhost:4000/oauth2callback";
const GOOGLE_ACCOUNT = "thomasduranrojas@gmail.com";

function imprimirChecklistGoogleCloud() {
  console.log(`
========================================
  CONFIGURACIÓN EN GOOGLE CLOUD (tú)
========================================

Necesito que confirmes estos pasos en tu cuenta de Google:

1. Abre: https://console.cloud.google.com/
2. Crea un proyecto (ej: "Moto Taller")
3. Habilita Google Calendar API:
   https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
4. Configura pantalla de consentimiento OAuth (usuarios externos / modo prueba)
   - Agrega tu correo ${GOOGLE_ACCOUNT} como usuario de prueba
5. Crea credenciales OAuth 2.0 (tipo: Aplicación web)
6. En "URIs de redirección autorizados" agrega AMBAS:
   - ${SETUP_REDIRECT_URI}
   - ${BACKEND_REDIRECT_URI}
7. Copia el Client ID y Client Secret

Cuando termines, vuelve aquí.
`);
}

function abrirNavegador(url: string) {
  const comando =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;

  spawn(comando, { shell: true, detached: true, stdio: "ignore" }).unref();
}

async function preguntar(mensaje: string) {
  const rl = readline.createInterface({ input, output });
  const respuesta = await rl.question(mensaje);
  rl.close();
  return respuesta.trim();
}

async function obtenerCredenciales() {
  let clientId = getEnvValue("GOOGLE_CLIENT_ID");
  let clientSecret = getEnvValue("GOOGLE_CLIENT_SECRET");

  if (clientId && clientSecret) {
    console.log("✓ Client ID y Client Secret encontrados en .env\n");
    return { clientId, clientSecret };
  }

  imprimirChecklistGoogleCloud();
  await preguntar("Presiona ENTER cuando hayas completado los pasos de Google Cloud...");

  clientId = await preguntar("Pega tu GOOGLE_CLIENT_ID: ");
  clientSecret = await preguntar("Pega tu GOOGLE_CLIENT_SECRET: ");

  if (!clientId || !clientSecret) {
    throw new Error("Client ID y Client Secret son obligatorios.");
  }

  updateEnvFile({
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: clientSecret,
    GOOGLE_REDIRECT_URI: BACKEND_REDIRECT_URI,
    GOOGLE_CALENDAR_ID: "primary",
  });

  console.log("\n✓ Credenciales guardadas en .env\n");
  return { clientId, clientSecret };
}

function esperarAutorizacion(clientId: string, clientSecret: string) {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, SETUP_REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  return new Promise<string>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url?.startsWith("/oauth2callback")) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }

        const url = new URL(req.url, `http://localhost:${SETUP_PORT}`);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`<h1>Error de autorización</h1><p>${error}</p>`);
          server.close();
          reject(new Error(error));
          return;
        }

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h1>Falta código de autorización</h1>");
          return;
        }

        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end(
            "<h1>No se obtuvo refresh token</h1><p>Revoca el acceso en tu cuenta Google y vuelve a intentar.</p>",
          );
          server.close();
          reject(new Error("No se obtuvo refresh_token"));
          return;
        }

        updateEnvFile({
          GOOGLE_REFRESH_TOKEN: tokens.refresh_token,
          GOOGLE_REDIRECT_URI: BACKEND_REDIRECT_URI,
          GOOGLE_CALENDAR_ID: "primary",
        });

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Listo</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>Google Calendar conectado</h1>
  <p>Cuenta: <strong>${GOOGLE_ACCOUNT}</strong></p>
  <p>El refresh token se guardó automáticamente en <code>back_taller/.env</code>.</p>
  <p>Ya puedes cerrar esta ventana y volver a la terminal.</p>
</body></html>`);

        server.close();
        resolve(tokens.refresh_token);
      } catch (callbackError) {
        server.close();
        reject(callbackError);
      }
    });

    server.listen(SETUP_PORT, () => {
      console.log(`Servidor de autorización en ${SETUP_REDIRECT_URI}`);
      console.log(`\nAbriendo navegador para iniciar sesión con ${GOOGLE_ACCOUNT}...\n`);
      console.log("Si no se abre solo, visita:\n");
      console.log(authUrl);
      console.log("");
      abrirNavegador(authUrl);
    });

    server.on("error", reject);
  });
}

async function probarCalendario(clientId: string, clientSecret: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, BACKEND_REDIRECT_URI);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const fecha = manana.toISOString().slice(0, 10);

  const evento = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: "Prueba Moto Taller - Google Calendar",
      description: "Evento de prueba. La integración funciona correctamente.",
      start: { date: fecha, timeZone: "America/Bogota" },
      end: {
        date: new Date(manana.getTime() + 86400000).toISOString().slice(0, 10),
        timeZone: "America/Bogota",
      },
    },
  });

  console.log(`✓ Evento de prueba creado: ${evento.data.htmlLink ?? evento.data.id}`);
}

async function main() {
  console.log("\n=== Asistente Google Calendar - Moto Taller ===\n");

  const { clientId, clientSecret } = await obtenerCredenciales();

  const refreshTokenActual = getEnvValue("GOOGLE_REFRESH_TOKEN");
  if (refreshTokenActual) {
    const reemplazar = await preguntar(
      "Ya existe un GOOGLE_REFRESH_TOKEN. ¿Generar uno nuevo? (s/N): ",
    );
    if (reemplazar.toLowerCase() !== "s") {
      console.log("\nUsando token existente. Probando conexión...\n");
      await probarCalendario(clientId, clientSecret, refreshTokenActual);
      console.log("\n✓ Google Calendar ya estaba configurado.\n");
      return;
    }
  }

  console.log(">>> NECESITO TU PERMISO AHORA <<<");
  console.log(`Se abrirá Google para que autorices el acceso con ${GOOGLE_ACCOUNT}.\n`);

  const continuar = await preguntar("¿Continuar con la autorización? (S/n): ");
  if (continuar.toLowerCase() === "n") {
    console.log("Cancelado.");
    return;
  }

  const refreshToken = await esperarAutorizacion(clientId, clientSecret);
  console.log("\n✓ Refresh token guardado en .env\n");

  await probarCalendario(clientId, clientSecret, refreshToken);

  console.log(`
========================================
  CONFIGURACIÓN COMPLETADA
========================================

Reinicia el backend:
  .\\dev.cmd

Al registrar una cita, se creará un evento en Google Calendar
con la fecha de entrega (+7 días).
`);
}

main().catch((error) => {
  console.error("\nError:", error instanceof Error ? error.message : error);
  process.exit(1);
});
