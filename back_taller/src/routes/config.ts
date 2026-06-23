import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const config = await prisma.configuracion.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      return res.status(404).json({ error: "Configuración no encontrada" });
    }

    res.json(config);
  } catch (error) {
    next(error);
  }
});

export default router;
