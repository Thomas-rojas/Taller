import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import multer from "multer";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "trabajos");
const EXTENSIONES = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = EXTENSIONES.has(ext) ? ext : ".jpg";
    cb(null, `${randomUUID()}${safeExt}`);
  },
});

export const uploadFotosTrabajo = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 100 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Solo se permiten imágenes (JPG, PNG, WEBP)."));
  },
});
