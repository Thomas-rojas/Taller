import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const items = await prisma.galeriaItem.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

export default router;
