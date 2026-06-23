import { prisma } from "../lib/prisma.js";
import { conCierre, coincide, normalizar } from "../lib/chatResponses.js";

async function respuestaServicios() {
  const servicios = await prisma.servicio.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  const lista = servicios
    .map((s, i) => `${i + 1}. ${s.titulo} — ${s.descripcion}`)
    .join("\n");

  return `En Moto Taller ofrecemos los siguientes servicios:\n\n${lista}`;
}

async function respuestaPorIntencion(mensaje: string): Promise<string | null> {
  const config = await prisma.configuracion.findUnique({
    where: { id: "default" },
  });

  if (coincide(mensaje, ["hola", "buenas", "buenos dias", "buenas tardes", "hey", "saludos"])) {
    return "¡Hola! Bienvenido a Moto Taller. Somos un taller familiar especializado en motos. ¿En qué puedo ayudarte hoy?";
  }

  if (
    coincide(mensaje, [
      "servicio",
      "servicios",
      "ofrecen",
      "ofrece",
      "hacen",
      "que trabajos",
      "que hacen",
      "mantenimiento",
      "reparacion",
      "reparaciones",
    ])
  ) {
    return await respuestaServicios();
  }

  if (coincide(mensaje, ["precio", "precios", "cuesta", "cuanto", "costo", "valor", "cotizacion", "presupuesto"])) {
    return "Los precios dependen del tipo de servicio, el modelo de la moto y el estado en que se encuentre. Trabajamos con transparencia y te explicamos el costo antes de realizar cualquier trabajo.";
  }

  if (coincide(mensaje, ["cita", "agendar", "agenda", "reservar", "programar", "turno"])) {
    return "Puedes solicitar una cita desde la sección de Contacto en esta página. Déjanos tu nombre, teléfono y el servicio que necesitas, y un asesor te confirmará la disponibilidad.";
  }

  if (coincide(mensaje, ["horario", "hora", "abren", "cierran", "atienden", "abierto", "domingo"])) {
    return `Nuestro horario de atención es: ${config?.horario ?? "Lunes a sábado de 8:00 a.m. a 6:00 p.m."} Los domingos permanecemos cerrados.`;
  }

  if (coincide(mensaje, ["ubicacion", "ubicados", "direccion", "donde", "llegar", "barrio", "taller"])) {
    return `Estamos ubicados en ${config?.direccion ?? "Calle 92sur #4a-29, Barrio el virrey"}. Puedes ver la ubicación exacta en el mapa de la sección Contacto.`;
  }

  if (coincide(mensaje, ["garantia", "garantizado", "confianza", "calidad"])) {
    return "Todos nuestros trabajos cuentan con garantía. Nos comprometemos con la honestidad, la calidad y el respeto por tu moto y tu tiempo.";
  }

  if (coincide(mensaje, ["demora", "tarda", "tiempo", "rapido", "cuanto demora", "duracion"])) {
    return "El tiempo de servicio varía según el trabajo. Contamos con servicio rápido según disponibilidad. Para un diagnóstico o mantenimiento básico, usualmente podemos darte un estimado el mismo día.";
  }

  if (coincide(mensaje, ["marca", "marcas", "yamaha", "honda", "suzuki", "bajaj", "pulsar", "akt", "tvs"])) {
    return "Atendemos motos de diferentes marcas. Cuéntanos el modelo de tu moto y con gusto te orientamos sobre el servicio que necesita.";
  }

  if (coincide(mensaje, ["aceite", "cambio de aceite", "filtro"])) {
    return "Realizamos cambio de aceite y filtros con productos de calidad. Es uno de nuestros servicios más solicitados para mantener tu moto en buen estado.";
  }

  if (coincide(mensaje, ["freno", "frenos", "pastilla", "disco"])) {
    return "Ofrecemos revisión, ajuste y cambio de frenos para que conduzcas con seguridad. Recomendamos revisarlos periódicamente.";
  }

  if (coincide(mensaje, ["llanta", "llantas", "neumatico", "balanceo"])) {
    return "Realizamos cambio y balanceo de llantas. Te ayudamos a elegir la mejor opción según el uso que le das a tu moto.";
  }

  if (coincide(mensaje, ["bateria", "batería", "electrico", "eléctrico", "luz", "arranque"])) {
    return "Atendemos sistema eléctrico, diagnóstico de fallas y cambio de baterías. Si tu moto tiene problemas eléctricos, podemos revisarla.";
  }

  if (coincide(mensaje, ["gracias", "muchas gracias", "ok", "perfecto", "listo", "entendido"])) {
    return "¡Con gusto! Estamos para ayudarte cuando lo necesites.";
  }

  return null;
}

async function respuestaPorFaq(mensaje: string): Promise<string | null> {
  const faqs = await prisma.preguntaFrecuente.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  const mensajeNorm = normalizar(mensaje);

  for (const faq of faqs) {
    const preguntaNorm = normalizar(faq.pregunta);
    if (
      mensajeNorm.includes(preguntaNorm) ||
      preguntaNorm.includes(mensajeNorm) ||
      mensajeNorm.split(" ").some(
        (palabra) => palabra.length > 3 && preguntaNorm.includes(palabra),
      )
    ) {
      return faq.respuesta;
    }
  }

  return null;
}

export async function buscarRespuesta(mensaje: string) {
  const porIntencion = await respuestaPorIntencion(mensaje);
  if (porIntencion) {
    return conCierre(porIntencion);
  }

  const porFaq = await respuestaPorFaq(mensaje);
  if (porFaq) {
    return conCierre(porFaq);
  }

  return conCierre(
    "Gracias por tu mensaje. Puedo ayudarte con información sobre nuestros servicios, horarios, ubicación, precios y citas. ¿Qué te gustaría saber?",
  );
}
