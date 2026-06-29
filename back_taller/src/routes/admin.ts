import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/requireMechanic.js";

import { obtenerEstadoBaileys } from "../services/whatsappBaileys.js";
import { greenApiConfigurado } from "../services/greenApi.js";
import {
  obtenerProveedorWhatsApp,
  whatsappAutomaticoHabilitado,
} from "../services/whatsappAuto.js";

const router = Router();

function normalizarTelefono(telefono: string) {
  return telefono.replace(/\D/g, "");
}

function nombreMecanico(
  registradoPor: string | null,
  mapa: Map<string, { nombre: string; apellidos: string }>,
) {
  if (!registradoPor) return "Sin asignar";
  if (registradoPor === "mecanico") return "Mecánico (acceso legacy)";
  const mecanico = mapa.get(registradoPor);
  if (!mecanico) return "Mecánico desconocido";
  return `${mecanico.nombre} ${mecanico.apellidos}`;
}

router.get("/clientes-frecuentes", requireAdmin, async (_req, res, next) => {
  try {
    const citas = await prisma.cita.findMany({
      where: { estado: { not: "cancelada" } },
      include: { servicio: true },
      orderBy: { createdAt: "desc" },
    });

    const porTelefono = new Map<
      string,
      {
        telefono: string;
        nombre: string;
        email: string | null;
        totalVisitas: number;
        ultimaVisita: Date | null;
        ultimoServicio: string | null;
        placas: Set<string>;
      }
    >();

    for (const cita of citas) {
      const clave = normalizarTelefono(cita.telefono) || cita.telefono;
      const existente = porTelefono.get(clave);

      if (!existente) {
        porTelefono.set(clave, {
          telefono: cita.telefono,
          nombre: cita.nombre,
          email: cita.email,
          totalVisitas: 1,
          ultimaVisita: cita.fechaRecepcion ?? cita.fechaPreferida ?? cita.createdAt,
          ultimoServicio: cita.servicio?.titulo ?? null,
          placas: new Set(cita.placa ? [cita.placa] : []),
        });
        continue;
      }

      existente.totalVisitas += 1;
      if (cita.placa) existente.placas.add(cita.placa);

      const fechaCita = cita.fechaRecepcion ?? cita.fechaPreferida ?? cita.createdAt;
      if (!existente.ultimaVisita || fechaCita > existente.ultimaVisita) {
        existente.ultimaVisita = fechaCita;
        existente.nombre = cita.nombre;
        existente.email = cita.email ?? existente.email;
        existente.ultimoServicio = cita.servicio?.titulo ?? existente.ultimoServicio;
      }
    }

    const clientes = Array.from(porTelefono.values())
      .map((cliente) => ({
        telefono: cliente.telefono,
        nombre: cliente.nombre,
        email: cliente.email,
        totalVisitas: cliente.totalVisitas,
        ultimaVisita: cliente.ultimaVisita?.toISOString() ?? null,
        ultimoServicio: cliente.ultimoServicio,
        placas: Array.from(cliente.placas),
        frecuente: cliente.totalVisitas >= 2,
      }))
      .sort((a, b) => b.totalVisitas - a.totalVisitas || a.nombre.localeCompare(b.nombre, "es"));

    res.json(clientes);
  } catch (error) {
    next(error);
  }
});

router.get("/historial-mecanicos", requireAdmin, async (req, res, next) => {
  try {
    const mecanicoId = typeof req.query.mecanicoId === "string" ? req.query.mecanicoId : undefined;

    const citas = await prisma.cita.findMany({
      where: {
        datosReparacionBloqueados: true,
        ...(mecanicoId ? { registradoPor: mecanicoId } : {}),
      },
      include: { servicio: true },
      orderBy: { fechaEntregaReal: "desc" },
    });

    const mecanicos = await prisma.mecanico.findMany({
      select: { id: true, nombre: true, apellidos: true },
    });
    const mapaMecanicos = new Map(mecanicos.map((m) => [m.id, m]));

    const historial = citas.map((cita) => ({
      id: cita.id,
      mecanicoId: cita.registradoPor,
      mecanicoNombre: nombreMecanico(cita.registradoPor, mapaMecanicos),
      clienteNombre: cita.nombre,
      telefono: cita.telefono,
      placa: cita.placa,
      estadoMotoIngreso: cita.estadoMotoIngreso,
      descripcionTrabajo: cita.descripcionTrabajo,
      servicio: cita.servicio?.titulo ?? null,
      estado: cita.estado,
      fechaRecepcion: cita.fechaRecepcion?.toISOString() ?? null,
      fechaEntregaReal: cita.fechaEntregaReal?.toISOString() ?? null,
    }));

    const mecanicosConTrabajos = mecanicos
      .map((m) => ({
        id: m.id,
        nombre: `${m.nombre} ${m.apellidos}`,
        totalTrabajos: historial.filter((h) => h.mecanicoId === m.id).length,
      }))
      .filter((m) => m.totalTrabajos > 0)
      .sort((a, b) => b.totalTrabajos - a.totalTrabajos);

    res.json({ historial, mecanicos: mecanicosConTrabajos });
  } catch (error) {
    next(error);
  }
});

router.get("/pendientes-revision", requireAdmin, async (_req, res, next) => {
  try {
    const citas = await prisma.cita.findMany({
      where: { estado: "finalizada" },
      include: { servicio: true },
      orderBy: { fechaEntregaReal: "desc" },
    });

    const mecanicos = await prisma.mecanico.findMany({
      select: { id: true, nombre: true, apellidos: true },
    });
    const mapaMecanicos = new Map(mecanicos.map((m) => [m.id, m]));

    res.json(
      citas.map((cita) => ({
        id: cita.id,
        nombre: cita.nombre,
        telefono: cita.telefono,
        email: cita.email,
        placa: cita.placa,
        descripcionTrabajo: cita.descripcionTrabajo,
        estadoMotoIngreso: cita.estadoMotoIngreso,
        servicio: cita.servicio?.titulo ?? null,
        fechaRecepcion: cita.fechaRecepcion?.toISOString() ?? null,
        fechaEntregaReal: cita.fechaEntregaReal?.toISOString() ?? null,
        mecanicoNombre:
          cita.registradoPor && mapaMecanicos.has(cita.registradoPor)
            ? `${mapaMecanicos.get(cita.registradoPor)!.nombre} ${mapaMecanicos.get(cita.registradoPor)!.apellidos}`
            : cita.registradoPor === "mecanico"
              ? "Mecánico (legacy)"
              : "Sin asignar",
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/whatsapp-estado", requireAdmin, async (_req, res, next) => {
  try {
    const baileys = await obtenerEstadoBaileys();
    const proveedor = obtenerProveedorWhatsApp();

    res.json({
      proveedor,
      greenApiConfigurado: greenApiConfigurado(),
      automaticoHabilitado: whatsappAutomaticoHabilitado(),
      ...baileys,
      conectado: proveedor !== "ninguno",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
