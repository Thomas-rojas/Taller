"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronRight, X } from "lucide-react";
import { api, type Servicio } from "@/src/lib/api";
import { WHATSAPP_URL } from "@/src/lib/contact";

const serviciosFallback: Servicio[] = [
  { id: "1", titulo: "Mantenimiento General", descripcion: "Revisión completa de tu moto", icono: "⚙️" },
  { id: "2", titulo: "Cambio de Aceite", descripcion: "Aceite y filtros de calidad", icono: "💧" },
  { id: "3", titulo: "Frenos", descripcion: "Seguridad en cada frenada", icono: "🔘" },
  { id: "4", titulo: "Llantas", descripcion: "Cambio y balanceo", icono: "🎡" },
  { id: "5", titulo: "Sistema Eléctrico", descripcion: "Diagnóstico y reparación", icono: "⚡" },
  { id: "6", titulo: "Baterías", descripcion: "Cambio y mantenimiento", icono: "🔋" },
  { id: "7", titulo: "Ajustes de Motor", descripcion: "Optimización del rendimiento", icono: "🛠️" },
  { id: "8", titulo: "Diagnóstico Básico", descripcion: "Identificación de fallas", icono: "🔍" },
  { id: "9", titulo: "Revisión Pre-viaje", descripcion: "Viaja con tranquilidad", icono: "🏍️" },
  { id: "10", titulo: "Servicio Rápido", descripcion: "Según disponibilidad", icono: "🕒" },
];

const imagenesServicio = ["/4.png", "/8.png", "/6.png", "/7.png", "/5.png", "/mecanico.png", "/moto.png"];

const detalleExtra: Record<string, string> = {
  "Mantenimiento General":
    "Inspeccionamos cadena, niveles, filtros, luces y puntos de desgaste. Te entregamos un reporte claro del estado de tu moto y las recomendaciones necesarias.",
  "Cambio de Aceite":
    "Utilizamos lubricantes de calidad y reemplazamos filtros según especificación del fabricante para prolongar la vida útil del motor.",
  Frenos:
    "Revisamos pastillas, discos, líquido de frenos y el sistema completo para garantizar una frenada segura en todo momento.",
  Llantas:
    "Instalamos, balanceamos y verificamos presión y desgaste para que tu moto ruede estable y con buen agarre.",
  "Sistema Eléctrico":
    "Diagnosticamos fallas en luces, arranque, regulador y cableado. Soluciones precisas sin cambios innecesarios.",
  Baterías:
    "Probamos carga y estado de la batería. Si requiere reemplazo, instalamos una nueva y verificamos el sistema de carga.",
  "Ajustes de Motor":
    "Calibramos carburación, válvulas y componentes clave para mejorar rendimiento, consumo y respuesta del motor.",
  "Diagnóstico Básico":
    "Identificamos ruidos, vibraciones o fallas intermitentes con un diagnóstico inicial antes de cualquier reparación.",
  "Revisión Pre-viaje":
    "Chequeo completo de frenos, llantas, luces, cadena y fluidos para que viajes con total tranquilidad.",
  "Servicio Rápido":
    "Atención ágil para trabajos menores según disponibilidad del taller. Ideal cuando necesitas una solución pronta.",
};

function useReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return { ref, visible };
}

function ServicioCard({ item, index }: { item: Servicio; index: number }) {
  const { ref, visible } = useReveal<HTMLDivElement>(index * 90);
  const [abierto, setAbierto] = useState(false);
  const imagen = imagenesServicio[index % imagenesServicio.length];
  const detalle = detalleExtra[item.titulo] ?? item.descripcion;

  return (
    <div
      ref={ref}
      className={[
        "bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-[#f0f0f0] flex flex-col transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f7f7f7]">
        <Image
          src={imagen}
          alt={item.titulo}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      <div className="p-6 flex flex-col flex-1 gap-3">
        <h3 className="text-lg font-semibold text-[#e8774a] tracking-tight">{item.titulo}</h3>
        <p className="text-sm text-[#737373]">Servicio especializado</p>

        <div
          className={[
            "overflow-hidden transition-all duration-300 ease-out",
            abierto ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
          ].join(" ")}
        >
          <p className="text-sm text-[#555555] leading-relaxed pt-1 pb-2 border-t border-[#f0f0f0]">
            {item.descripcion}. {detalle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="mt-auto inline-flex items-center justify-center gap-2 w-full bg-[#e8774a] hover:bg-[#d4693e] text-white text-sm font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {abierto ? (
            <>
              Cerrar
              <X size={16} />
            </>
          ) : (
            <>
              Conoce más
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const SeccionServicios: React.FC = () => {
  const [servicios, setServicios] = useState<Servicio[]>(serviciosFallback);
  const { ref: headerRef, visible: headerVisible } = useReveal<HTMLDivElement>(0);

  useEffect(() => {
    api.getServicios().then(setServicios).catch(() => {});
  }, []);

  return (
    <section className="py-24 md:py-32 bg-white border-t border-[#e8e8e8]">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div
          ref={headerRef}
          className={[
            "text-center max-w-2xl mx-auto mb-14 md:mb-16 transition-all duration-700 ease-out",
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          ].join(" ")}
        >
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-[0.12em] text-[#e8774a] mb-3">
            Nuestros servicios
          </h2>
          <p className="text-[#737373] text-sm md:text-base">Garantía, servicio y confianza.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicios.map((item, index) => (
            <ServicioCard key={item.id} item={item} index={index} />
          ))}
        </div>

        <div
          className={[
            "mt-16 text-center transition-all duration-700 delay-300",
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          ].join(" ")}
        >
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-[#e8774a] hover:text-[#d4693e] font-medium border-b border-[#e8774a] pb-0.5 transition-colors"
          >
            Consultar otro servicio
          </a>
        </div>
      </div>
    </section>
  );
};

export default SeccionServicios;
