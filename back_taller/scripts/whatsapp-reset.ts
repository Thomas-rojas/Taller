import fs from "fs";
import os from "os";
import path from "path";

const LOCK_FILES = new Set([
  "SingletonLock",
  "SingletonCookie",
  "SingletonSocket",
  "lockfile",
  "DevToolsActivePort",
]);

function limpiarLocks(directorio: string) {
  if (!fs.existsSync(directorio)) return 0;

  let eliminados = 0;

  function recorrer(dir: string) {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const ruta = path.join(dir, entrada.name);
      if (entrada.isDirectory()) {
        recorrer(ruta);
      } else if (LOCK_FILES.has(entrada.name)) {
        try {
          fs.unlinkSync(ruta);
          eliminados += 1;
          console.log(`Eliminado: ${ruta}`);
        } catch {
          console.warn(`No se pudo eliminar: ${ruta}`);
        }
      }
    }
  }

  recorrer(directorio);
  return eliminados;
}

const dirs = [
  path.join(process.cwd(), ".whatsapp-auth"),
  path.join(os.homedir(), ".moto-taller-whatsapp"),
];

let total = 0;
for (const dir of dirs) {
  console.log(`\nLimpiando locks en ${dir}...`);
  total += limpiarLocks(dir);
}

console.log(`\nListo. ${total} archivo(s) de bloqueo eliminado(s).`);
console.log("Reinicia el backend: npm run dev");
