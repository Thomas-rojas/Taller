"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, type GaleriaItem } from "@/src/lib/api";

const galeriaFallback: GaleriaItem[] = [
  {
    id: "1",
    src: "/4.png",
    alt: "Mecánico trabajando",
    titulo: "Trabajo en proceso",
    descripcion: "Reparación de motor",
    size: "large",
  },
  {
    id: "2",
    src: "/6.png",
    alt: "Moto frontal",
    titulo: "Resultado final",
    descripcion: "Moto después del servicio",
    size: "small",
  },
  {
    id: "3",
    src: "/5.png",
    alt: "Herramientas del taller",
    titulo: "Nuestro taller",
    descripcion: "Herramientas profesionales",
    size: "small",
  },
  {
    id: "4",
    src: "/8.png",
    alt: "Moto en taller",
    titulo: "En taller",
    descripcion: "Servicio de frenos",
    size: "small",
  },
  {
    id: "5",
    src: "/7.png",
    alt: "Mecánico ajustando moto",
    titulo: "Clientes felices",
    descripcion: "Clientes satisfechos",
    size: "small",
  },
];

const INTERVALO_MS = 4500;

const Galeria = () => {
  const [images, setImages] = useState<GaleriaItem[]>(galeriaFallback);
  const [activa, setActiva] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    api
      .getGaleria()
      .then((data) => {
        if (data.length > 0) {
          setImages(data);
          setActiva(0);
        }
      })
      .catch(() => {});
  }, []);

  const total = images.length;

  const irA = useCallback((index: number) => {
    setActiva((index + total) % total);
  }, [total]);

  const anterior = useCallback(() => irA(activa - 1), [activa, irA]);
  const siguiente = useCallback(() => irA(activa + 1), [activa, irA]);

  useEffect(() => {
    const track = trackRef.current;
    const card = cardRefs.current[activa];
    if (!track || !card) return;

    const section = track.closest("section");
    if (section) {
      const rect = section.getBoundingClientRect();
      const visible = rect.top < window.innerHeight && rect.bottom > 0;
      if (!visible) return;
    }

    const scrollLeft = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
    track.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }, [activa]);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => setActiva((i) => (i + 1) % total), INTERVALO_MS);
    return () => clearInterval(id);
  }, [total]);

  return (
    <section className="py-24 md:py-32 bg-white border-t border-[#e8e8e8] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-12 mb-12">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-[#737373] mb-4">Galería</p>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-[#111111]">
            Trabajos realizados
          </h2>
        </div>
      </div>

      <div className="relative">
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Anterior"
              className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-white shadow-md border border-[#e8e8e8] text-[#111111] hover:bg-[#f7f7f7] transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={siguiente}
              aria-label="Siguiente"
              className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-white shadow-md border border-[#e8e8e8] text-[#111111] hover:bg-[#f7f7f7] transition-colors"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        <div
          ref={trackRef}
          className="flex gap-5 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth px-[max(1.5rem,calc(50%-140px))] md:px-[max(2rem,calc(50%-170px))] pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, index) => {
            const esActiva = index === activa;
            return (
              <div
                key={img.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                onClick={() => irA(index)}
                className={[
                  "snap-center shrink-0 cursor-pointer transition-all duration-500 ease-out",
                  "w-[260px] sm:w-[280px] md:w-[320px]",
                  esActiva ? "scale-100 opacity-100" : "scale-[0.92] opacity-70",
                ].join(" ")}
              >
                <div
                  className={[
                    "relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#f7f7f7]",
                    "shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
                    esActiva ? "ring-2 ring-[#111111]/10" : "",
                  ].join(" ")}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    sizes="320px"
                    priority={index < 2}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <p
                      className={[
                        "text-white font-light tracking-wide transition-all duration-500",
                        esActiva
                          ? "text-2xl md:text-3xl italic"
                          : "text-xl md:text-2xl italic opacity-90",
                      ].join(" ")}
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      {img.titulo}
                    </p>
                  </div>
                </div>
                {esActiva && (
                  <p className="text-center text-sm text-[#737373] mt-4 px-2">{img.descripcion}</p>
                )}
              </div>
            );
          })}
        </div>

        {total > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            {images.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => irA(index)}
                aria-label={`Ir a ${img.titulo}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === activa ? "w-8 bg-[#111111]" : "w-1.5 bg-[#d4d4d4] hover:bg-[#737373]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Galeria;
