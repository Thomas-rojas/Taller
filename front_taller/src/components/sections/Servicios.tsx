"use client";

import React, { useEffect, useState } from "react";
import { api, type Servicio } from "@/src/lib/api";
import { WHATSAPP_URL } from "@/src/lib/contact";

const serviciosFallback: Servicio[] = [
  { id: "1", titulo: "Mantenimiento General", descripcion: "Revisión completa de tu moto", icono: "⚙️" },
  { id: "2", titulo: "Cambio de Aceite", descripcion: "Aceite y filtros de calidad", icono: "💧" },
  { id: "3", titulo: "Frenos", descripcion: "Seguridad en cada frenada", icono: "🔘" },
  { id: "4", titulo: "Llantas", descripcion: "Cambio y balanceo", icono: "🎡" },
];

const SeccionServicios: React.FC = () => {
  const [servicios, setServicios] = useState<Servicio[]>(serviciosFallback);

  useEffect(() => {
    api.getServicios().then(setServicios).catch(() => {});
  }, []);

  return (
    <section className="bg-[#0a0a0a] min-h-screen text-white p-6 md:p-12 lg:p-20 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Nuestros Servicios
          </h2>
          <div className="h-[3px] w-12 bg-[#e65100] mb-8" />
          <p className="text-[#a0a0a0] text-lg md:text-xl font-medium">
            Todo lo que tu moto necesita, con honestidad y experiencia
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {servicios.map((item) => (
            <div
              key={item.id}
              className="bg-[#1a1a1a] p-8 rounded-2xl border border-transparent hover:border-[#333] transition-all duration-300 flex flex-col items-start group cursor-pointer"
            >
              <div className="bg-[#2a1a14] w-14 h-14 rounded-xl flex items-center justify-center mb-8 group-hover:bg-[#3d251a] transition-colors">
                <span className="text-[#ff5722] text-2xl filter drop-shadow-md">
                  {item.icono}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-3 tracking-wide group-hover:text-[#ff5722] transition-colors">
                {item.titulo}
              </h3>
              <p className="text-[#808080] text-[15px] leading-relaxed">{item.descripcion}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <p className="text-[#a0a0a0] text-lg mb-4">¿No encuentras lo que buscas?</p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-[#ff5722] font-bold text-lg hover:underline decoration-2 underline-offset-8 transition-all"
          >
            Pregúntanos por WhatsApp
            <span className="ml-2 text-xl">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default SeccionServicios;
