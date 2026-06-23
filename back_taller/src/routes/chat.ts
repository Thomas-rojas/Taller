import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { buscarRespuesta } from "../services/chatBot.js";

const router = Router();

const mensajeSchema = z.object({
  mensaje: z.string().min(1, "El mensaje no puede estar vacío"),
});

router.get("/faqs", async (_req, res, next) => {
  try {
    const faqs = await prisma.preguntaFrecuente.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      select: { id: true, pregunta: true },
    });
    res.json(faqs);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { mensaje } = mensajeSchema.parse(req.body);
    const respuesta = await buscarRespuesta(mensaje);

    const registro = await prisma.mensajeChat.create({
      data: { mensaje, respuesta },
    });

    res.status(201).json({
      mensaje: registro.mensaje,
      respuesta: registro.respuesta,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
