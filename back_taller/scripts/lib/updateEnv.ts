import fs from "node:fs";
import path from "node:path";

export function getEnvPath() {
  return path.join(process.cwd(), ".env");
}

export function readEnvFile(envPath = getEnvPath()) {
  if (!fs.existsSync(envPath)) {
    return "";
  }
  return fs.readFileSync(envPath, "utf8");
}

export function updateEnvFile(updates: Record<string, string>, envPath = getEnvPath()) {
  let content = readEnvFile(envPath);

  if (!content.trim()) {
    content = `DATABASE_URL="file:./dev.db"\nPORT=4000\nCORS_ORIGIN="http://localhost:3000,http://127.0.0.1:3000"\n\n`;
  }

  for (const [key, value] of Object.entries(updates)) {
    const pattern = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}="${value}"`;

    if (pattern.test(content)) {
      content = content.replace(pattern, line);
    } else {
      content = `${content.trimEnd()}\n${line}\n`;
    }
  }

  fs.writeFileSync(envPath, content, "utf8");
}

export function getEnvValue(key: string, envPath = getEnvPath()) {
  const content = readEnvFile(envPath);
  const match = content.match(new RegExp(`^${key}="?([^"\\n]+)"?`, "m"));
  return match?.[1] ?? process.env[key];
}
