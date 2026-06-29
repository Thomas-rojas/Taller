import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const testimonios = await prisma.testimonio.findMany({
      where: { publicado: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombre: true,
        moto: true,
        texto: true,
        createdAt: true,
      },
    });

    res.json(testimonios);
  } catch (error) {
    next(error);
  }
});

export default router;
