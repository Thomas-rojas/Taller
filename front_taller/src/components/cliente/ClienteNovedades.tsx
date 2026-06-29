"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Newspaper, Radio, Sparkles, Wrench } from "lucide-react";
import { api, type NovedadMoto } from "@/src/lib/api";

const REFRESH_MS = 90 * 1000;

const ETIQUETA_TIPO: Record<NovedadMoto["tipo"], string> = {
  noticia: "Noticia",
  lanzamiento: "Lanzamiento",
  tip: "Cuidado de tu moto",
};

const ICONO_TIPO = {
  noticia: Newspaper,
  lanzamiento: Sparkles,
  tip: Wrench,
};

type ClienteNovedadesProps = {
  token: string;
};

export default function ClienteNovedades({ token }: ClienteNovedadesProps) {
  const [novedades, setNovedades] = useState<NovedadMoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualizado, setActualizado] = useState<Date | null>(null);

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setLoading(true);
      try {
        const data = await api.getNovedadesCliente(token);
        setNovedades(data);
        setActualizado(new Date());
      } catch {
        if (!silencioso) setNovedades([]);
      } finally {
        if (!silencioso) setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void cargar();
    const intervalo = setInterval(() => void cargar(true), REFRESH_MS);

    const alVisibilidad = () => {
      if (document.visibilityState === "visible") void cargar(true);
    };
    document.addEventListener("visibilitychange", alVisibilidad);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVisibilidad);
    };
  }, [cargar]);

  if (loading) {
    return (
      <section>
        <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#ff6b2c]/80 sm:text-xs">
          Novedades y tips bikers
        </h3>
        <p className="text-sm text-[#9ca3af]">Cargando noticias y consejos...</p>
      </section>
    );
  }

  if (novedades.length === 0) {
    return (
      <section>
        <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#ff6b2c]/80 sm:text-xs">
          Novedades y tips bikers
        </h3>
        <p className="text-sm text-[#9ca3af]">No hay novedades disponibles por ahora.</p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#ff6b2c]/80 sm:text-xs">
          Novedades y tips bikers
        </h3>
        <div className="flex items-center gap-2 text-[10px] text-[#6b7280]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b2c] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff6b2c]" />
          </span>
          <Radio size={12} className="text-[#ff6b2c]" />
          <span>Se actualiza cada {REFRESH_MS / 1000}s</span>
          {actualizado && (
            <span className="hidden sm:inline">
              · {actualizado.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {novedades.map((item) => {
          const Icono = ICONO_TIPO[item.tipo];
          const contenido = (
            <article className="flex h-full gap-3 rounded-2xl bg-[#161d2b] border border-white/5 p-3 sm:p-4 transition-colors hover:border-white/10">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-[#0c1017]">
                {item.imagen ? (
                  <Image
                    src={item.imagen}
                    alt={item.titulo}
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized={item.imagen.startsWith("http") && !item.imagen.includes("images.unsplash.com")}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#ff6b2c]">
                    <Icono size={24} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={[
                    "inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider mb-1.5",
                    item.tipo === "lanzamiento"
                      ? "bg-[#ff6b2c]/20 text-[#ff6b2c]"
                      : item.tipo === "tip"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-blue-500/15 text-blue-400",
                  ].join(" ")}
                >
                  {ETIQUETA_TIPO[item.tipo]}
                </span>
                <p className="text-sm font-semibold leading-snug line-clamp-2">{item.titulo}</p>
                <p className="mt-1 text-xs text-[#9ca3af] leading-relaxed line-clamp-3">
                  {item.descripcion}
                </p>
                {item.fuente && (
                  <p className="mt-2 text-[10px] text-[#6b7280] truncate">{item.fuente}</p>
                )}
                {item.url && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#ff6b2c]">
                    <ExternalLink size={10} />
                    Leer más
                  </span>
                )}
              </div>
            </article>
          );

          if (item.url) {
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                {contenido}
              </a>
            );
          }

          return (
            <div key={item.id} className="h-full">
              {contenido}
            </div>
          );
        })}
      </div>
    </section>
  );
}
