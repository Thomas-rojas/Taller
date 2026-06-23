"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { api, type GaleriaItem } from "@/src/lib/api";

const galeriaFallback: GaleriaItem[] = [
  {
    id: "1",
    src: "/4.png",
    alt: "Mecánico trabajando",
    titulo: "Trabajo en proceso",
    descripcion: "Reparacion de Motor",
    size: "large",
  },
  {
    id: "2",
    src: "/6.png",
    alt: "Moto frontal",
    titulo: "Resultado Final",
    descripcion: "Moto despues del servicio",
    size: "small",
  },
];

const Galeria = () => {
  const [images, setImages] = useState<GaleriaItem[]>(galeriaFallback);

  useEffect(() => {
    api.getGaleria().then(setImages).catch(() => {});
  }, []);

  return (
    <section className="bg-[#121212] py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-white text-5xl font-bold mb-2">Galeria</h2>
          <div className="w-16 h-1 bg-orange-600 mx-auto mb-4" />
          <p className="text-gray-400 italic">Nuestro trabajo habla por sí solo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px]">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative group overflow-hidden rounded-xl cursor-pointer ${
                img.size === "large" ? "md:col-span-2 md:row-span-2" : "md:col-span-1"
              }`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-orange-500 text-sm font-bold uppercase mb-1">
                  {img.titulo}
                </span>
                <h3 className="text-white text-xl font-bold leading-tight">{img.descripcion}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Galeria;
