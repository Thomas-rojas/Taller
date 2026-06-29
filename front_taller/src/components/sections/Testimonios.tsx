"use client";

import { useEffect, useMemo, useState } from "react";
import { api, type Testimonio } from "@/src/lib/api";

const TESTIMONIOS_BASE = [
  {
    nombre: "Carlos M.",
    moto: "Yamaha FZ",
    texto:
      "Llevé mi moto con un ruido extraño y me explicaron todo antes de tocarla. Trabajo impecable y entrega a tiempo.",
  },
  {
    nombre: "Laura P.",
    moto: "Honda CB 190",
    texto:
      "Se nota la diferencia con un taller que cuida los detalles. Precios claros, cero sorpresas y un trato muy humano.",
  },
  {
    nombre: "Andrés R.",
    moto: "AKT NKD 125",
    texto:
      "Confío en ellos como si fuera familia. Cada visita es la misma experiencia: profesional, honesta y premium.",
  },
  {
    nombre: "María Fernanda G.",
    moto: "Suzuki GN 125",
    texto:
      "Me hicieron el mantenimiento completo y me avisaron de un desgaste antes de que fuera un problema. Muy recomendados.",
  },
  {
    nombre: "Jhonatan V.",
    moto: "Bajaj Pulsar 160",
    texto:
      "Cambié frenos y aceite en el mismo día. Quedó suave, sin ruidos y con un precio justo. Volveré sin dudarlo.",
  },
  {
    nombre: "Diana S.",
    moto: "Yamaha YBR 125",
    texto:
      "El trato es excelente. Te explican qué necesita la moto y qué puede esperar. Eso da mucha tranquilidad.",
  },
  {
    nombre: "Ricardo T.",
    moto: "Honda XR 190",
    texto:
      "Llevo años trayendo mi moto aquí. Siempre cumplen con la fecha de entrega y el trabajo queda impecable.",
  },
  {
    nombre: "Valentina L.",
    moto: "AKT TT 200",
    texto:
      "Fui por una revisión pre-viaje y detectaron un detalle en la cadena. Gracias a eso viajé sin preocupaciones.",
  },
  {
    nombre: "Esteban C.",
    moto: "KTM Duke 200",
    texto:
      "Diagnóstico rápido y solución acertada. No intentan venderte cosas que no necesitas. Eso se agradece.",
  },
  {
    nombre: "Paola H.",
    moto: "TVS Apache 160",
    texto:
      "Mi moto quedó como nueva después del servicio eléctrico. Atención puntual y muy buena comunicación por WhatsApp.",
  },
];

function formatearNombrePublico(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[1].charAt(0).toUpperCase()}.`;
}

function mapTestimonioApi(item: Testimonio) {
  return {
    id: item.id,
    nombre: formatearNombrePublico(item.nombre),
    moto: item.moto,
    texto: item.texto,
  };
}

export default function Testimonios() {
  const [deClientes, setDeClientes] = useState<ReturnType<typeof mapTestimonioApi>[]>([]);

  useEffect(() => {
    api
      .getTestimonios()
      .then((lista) => setDeClientes(lista.map(mapTestimonioApi)))
      .catch(() => setDeClientes([]));
  }, []);

  const testimonios = useMemo(() => {
    const combinados = [...deClientes, ...TESTIMONIOS_BASE];
    return combinados.length > 0 ? combinados : TESTIMONIOS_BASE;
  }, [deClientes]);

  const items = [...testimonios, ...testimonios];

  return (
    <section className="py-24 md:py-32 bg-[#f7f7f7] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-12 mb-14 md:mb-16">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-[#737373] mb-4">Testimonios</p>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-[#111111]">
            Lo que dicen nuestros clientes
          </h2>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-24 bg-gradient-to-r from-[#f7f7f7] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-24 bg-gradient-to-l from-[#f7f7f7] to-transparent z-10" />

        <div className="flex w-max animate-marquee-ltr gap-6 px-6">
          {items.map((item, index) => (
            <blockquote
              key={"id" in item && item.id ? `${item.id}-${index}` : `${item.nombre}-${index}`}
              className="shrink-0 w-[300px] sm:w-[340px] md:w-[380px] bg-white border border-[#e8e8e8] rounded-2xl p-8 flex flex-col gap-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
            >
              <p className="text-[#737373] leading-relaxed text-[15px]">&ldquo;{item.texto}&rdquo;</p>
              <footer className="border-t border-[#e8e8e8] pt-6 mt-auto">
                <p className="font-medium text-[#111111] text-sm">{item.nombre}</p>
                <p className="text-xs text-[#e8774a] mt-1">{item.moto}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
