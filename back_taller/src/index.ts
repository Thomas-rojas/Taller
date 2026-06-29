import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "path";
import { errorHandler } from "./middleware/errorHandler.js";
import { prisma } from "./lib/prisma.js";
import citasRouter from "./routes/citas.js";
import serviciosRouter from "./routes/servicios.js";
import galeriaRouter from "./routes/galeria.js";
import chatRouter from "./routes/chat.js";
import configRouter from "./routes/config.js";
import calendarRouter from "./routes/calendar.js";
import mecanicosRouter from "./routes/mecanicos.js";
import clientesRouter from "./routes/clientes.js";
import adminRouter from "./routes/admin.js";
import testimoniosRouter from "./routes/testimonios.js";
import { google } from "googleapis";
import { iniciarWhatsAppBaileys } from "./services/whatsappBaileys.js";
import { greenApiConfigurado } from "./services/greenApi.js";
import { whatsappCloudConfigurado } from "./services/whatsappCloud.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const corsOrigin =
  process.env.CORS_ORIGIN ??
  "http://localhost:3000,http://127.0.0.1:3000";

app.use(
  cors({
    origin: corsOrigin.split(",").map((origin) => origin.trim()),
  }),
);
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", async (_req, res) => {
  try {
    const [servicios, citas, galeria, config] = await Promise.all([
      prisma.servicio.count(),
      prisma.cita.count(),
      prisma.galeriaItem.count(),
      prisma.configuracion.findUnique({ where: { id: "default" } }),
    ]);

    res.json({
      status: "ok",
      service: "Moto Taller API",
      database: {
        connected: true,
        servicios,
        citas,
        galeria,
        configuracion: Boolean(config),
      },
    });
  } catch (error) {
    console.error("Error de base de datos:", error);
    res.status(503).json({
      status: "error",
      service: "Moto Taller API",
      database: { connected: false },
      error: "No se pudo conectar con la base de datos",
    });
  }
});

app.use("/api/citas", citasRouter);
app.use("/api/servicios", serviciosRouter);
app.use("/api/galeria", galeriaRouter);
app.use("/api/chat", chatRouter);
app.use("/api/config", configRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/mecanicos", mecanicosRouter);
app.use("/api/clientes", clientesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/testimonios", testimoniosRouter);

app.get("/oauth2callback", async (req, res, next) => {
  try {
    const code = req.query.code as string | undefined;
    if (!code) {
      return res.status(400).send("Falta el código de autorización de Google.");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4000/oauth2callback";

    if (!clientId || !clientSecret) {
      return res
        .status(400)
        .send("Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env");
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    res.send(`<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Google Calendar</title></head>
<body style="font-family:sans-serif;max-width:720px;margin:40px auto;padding:20px;">
  <h1>Google Calendar conectado</h1>
  <p>Cuenta: <strong>thomasduranrojas@gmail.com</strong></p>
  <p>Copia esta línea en <code>back_taller/.env</code> y reinicia el backend:</p>
  <pre style="background:#f4f4f4;padding:16px;border-radius:8px;overflow:auto;">GOOGLE_REFRESH_TOKEN=${tokens.refresh_token ?? ""}</pre>
  <p>También asegúrate de tener:</p>
  <pre style="background:#f4f4f4;padding:16px;border-radius:8px;">GOOGLE_CALENDAR_ID=primary</pre>
</body>
</html>`);
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

app.listen(port, "0.0.0.0", () => {
  console.log(`API corriendo en http://localhost:${port}`);
  console.log(`[WhatsApp] WHATSAPP_BAILEYS=${process.env.WHATSAPP_BAILEYS ?? "(sin definir)"}`);

  if (greenApiConfigurado()) {
    console.log("[WhatsApp] Green API configurada — envío automático activo.");
  } else if (whatsappCloudConfigurado()) {
    console.log("[WhatsApp] Meta Cloud API configurada — envío automático activo.");
  } else if (process.env.WHATSAPP_BAILEYS !== "false") {
    console.log("[WhatsApp] Iniciando whatsapp-web.js (escanea el QR en /mecanico).");
    iniciarWhatsAppBaileys();
  } else {
    console.log("[WhatsApp] Desactivado — las notificaciones se envían por correo.");
  }
});
