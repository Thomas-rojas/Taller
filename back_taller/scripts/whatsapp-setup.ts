import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const cacheDir = path.join(os.homedir(), ".cache", "moto-taller-puppeteer");
fs.mkdirSync(cacheDir, { recursive: true });

process.env.PUPPETEER_CACHE_DIR = cacheDir;

console.log(`Instalando Chrome para WhatsApp en ${cacheDir}...`);
execSync("npx puppeteer browsers install chrome", {
  stdio: "inherit",
  env: { ...process.env, PUPPETEER_CACHE_DIR: cacheDir },
});

console.log("\nChrome listo. Reinicia el backend: npm run dev");
