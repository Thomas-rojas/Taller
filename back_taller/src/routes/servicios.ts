import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const servicios = await prisma.servicio.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });
    res.json(servicios);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const servicio = await prisma.servicio.findUnique({
      where: { id: req.params.id },
    });

    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    res.json(servicio);
  } catch (error) {
    next(error);
  }
});

export default router;
