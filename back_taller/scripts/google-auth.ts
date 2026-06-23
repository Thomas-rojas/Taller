import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4000/oauth2callback";

  if (!clientId || !clientSecret) {
    console.error("Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env");
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("\n1. Abre esta URL en tu navegador e inicia sesión con thomasduranrojas@gmail.com:\n");
  console.log(authUrl);
  console.log("\n2. Copia el código de autorización y pégalo aquí.\n");

  const rl = readline.createInterface({ input, output });
  const code = await rl.question("Código de autorización: ");
  rl.close();

  const { tokens } = await oauth2Client.getToken(code.trim());

  console.log("\nAgrega esto a tu archivo .env:\n");
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log(`GOOGLE_CALENDAR_ID=primary`);
  console.log("\nGuarda el .env y reinicia el backend.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
