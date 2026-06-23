import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const servicios = [
  { titulo: "Mantenimiento General", descripcion: "Revisión completa de tu moto", icono: "⚙️", orden: 1 },
  { titulo: "Cambio de Aceite", descripcion: "Aceite y filtros de calidad", icono: "💧", orden: 2 },
  { titulo: "Frenos", descripcion: "Seguridad en cada frenada", icono: "🔘", orden: 3 },
  { titulo: "Llantas", descripcion: "Cambio y balanceo", icono: "🎡", orden: 4 },
  { titulo: "Sistema Eléctrico", descripcion: "Diagnóstico y reparación", icono: "⚡", orden: 5 },
  { titulo: "Baterías", descripcion: "Cambio y mantenimiento", icono: "🔋", orden: 6 },
  { titulo: "Ajustes de Motor", descripcion: "Optimización del rendimiento", icono: "🛠️", orden: 7 },
  { titulo: "Diagnóstico Básico", descripcion: "Identificación de fallas", icono: "🔍", orden: 8 },
  { titulo: "Revisión Pre-viaje", descripcion: "Viaja con tranquilidad", icono: "🏍️", orden: 9 },
  { titulo: "Servicio Rápido", descripcion: "Según disponibilidad", icono: "🕒", orden: 10 },
];

const galeria = [
  { src: "/4.png", alt: "Mecánico trabajando", titulo: "Trabajo en proceso", descripcion: "Reparacion de Motor", size: "large", orden: 1 },
  { src: "/6.png", alt: "Moto frontal", titulo: "Resultado Final", descripcion: "Moto despues del servicio", size: "small", orden: 2 },
  { src: "/5.png", alt: "Herramientas", titulo: "Nuestro taller", descripcion: "Herramientas profesionales", size: "small", orden: 3 },
  { src: "/8.png", alt: "Moto en taller", titulo: "Trabajo en Proceso", descripcion: "Servicio de frenos", size: "small", orden: 4 },
  { src: "/7.png", alt: "Mecánico ajustando moto", titulo: "Clientes Felices", descripcion: "Clientes Satisfechos", size: "small", orden: 5 },
];

const faqs = [
  {
    pregunta: "¿Qué servicios ofrecen?",
    respuesta:
      "Ofrecemos mantenimiento general, cambio de aceite, frenos, llantas, sistema eléctrico, baterías, ajustes de motor, diagnóstico básico, revisión pre-viaje y servicio rápido según disponibilidad.",
    orden: 1,
  },
  {
    pregunta: "¿Cuánto cuesta el mantenimiento?",
    respuesta:
      "El costo depende del modelo y el estado de la moto. Trabajamos con precios justos y transparentes, y te explicamos el valor antes de iniciar cualquier trabajo.",
    orden: 2,
  },
  {
    pregunta: "Quiero agendar una cita",
    respuesta:
      "Puedes agendar una cita desde la sección Contacto en esta página. Déjanos tu nombre, teléfono y el servicio que necesitas.",
    orden: 3,
  },
  {
    pregunta: "¿Cuál es su horario?",
    respuesta: "Atendemos de lunes a sábado de 8:00 a.m. a 6:00 p.m. Los domingos cerramos.",
    orden: 4,
  },
  {
    pregunta: "¿Dónde están ubicados?",
    respuesta: "Estamos en Calle 92sur #4a-29, Barrio el virrey. Puedes ver el mapa en la sección Contacto.",
    orden: 5,
  },
  {
    pregunta: "¿Tienen garantía en los trabajos?",
    respuesta:
      "Sí, nuestros trabajos están garantizados. Nos comprometemos con la calidad, la honestidad y el buen trato a cada moto.",
    orden: 6,
  },
  {
    pregunta: "¿Cuánto demora un servicio?",
    respuesta:
      "El tiempo depende del tipo de servicio. Para mantenimientos y diagnósticos básicos solemos darte un estimado el mismo día.",
    orden: 7,
  },
];

async function main() {
  await prisma.mensajeChat.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.servicio.deleteMany();
  await prisma.galeriaItem.deleteMany();
  await prisma.preguntaFrecuente.deleteMany();

  await prisma.servicio.createMany({ data: servicios });
  await prisma.galeriaItem.createMany({ data: galeria });
  await prisma.preguntaFrecuente.createMany({ data: faqs });

  await prisma.configuracion.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      whatsapp: "+57 314 490 2016",
      telefono: "+57 322 680 7105",
      direccion: "Calle 92sur #4a-29, Barrio el virrey",
      horario: "Lunes a sábado: 8:00 a.m. - 6:00 p.m.",
      instagram: "",
      facebook: "",
      youtube: "",
    },
  });

  console.log("Base de datos inicializada correctamente.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
