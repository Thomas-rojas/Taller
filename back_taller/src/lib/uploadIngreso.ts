import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import multer from "multer";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "ingreso");
const FOTO_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".3gp", ".m4v"]);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const esFoto = file.fieldname === "fotos";
    const permitidas = esFoto ? FOTO_EXT : VIDEO_EXT;
    const safeExt = permitidas.has(ext) ? ext : esFoto ? ".jpg" : ".mp4";
    cb(null, `${randomUUID()}${safeExt}`);
  },
});

export const uploadRegistroIngreso = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "fotos" && file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    if (file.fieldname === "videos" && file.mimetype.startsWith("video/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Archivo no válido. Usa fotos (JPG, PNG) o videos (MP4, MOV)."));
  },
}).fields([
  { name: "fotos", maxCount: 10 },
  { name: "videos", maxCount: 5 },
]);
