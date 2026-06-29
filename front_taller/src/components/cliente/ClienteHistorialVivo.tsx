"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bike,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Package,
  Radio,
  Wrench,
} from "lucide-react";
import { api, type ActividadCliente, type CitaCliente } from "@/src/lib/api";
import { formatearFechaCompleta, tieneMotoEntregada } from "./clienteUtils";
import ClienteTestimonio from "./ClienteTestimonio";

const POLL_MS = 5000;

const ICONO_TIPO: Record<string, typeof Wrench> = {
  cita_solicitada: CalendarCheck,
  confirmada: CheckCircle2,
  recepcion: Bike,
  trabajo_progreso: Wrench,
  trabajo: Wrench,
  finalizada: ClipboardList,
  lista_retiro: Package,
  entregada: CheckCircle2,
  cancelada: ClipboardList,
};

function urlMedia(src: string) {
  if (src.startsWith("http")) return src;
  return src;
}

type ClienteHistorialVivoProps = {
  token: string;
  nombre: string;
  citas: CitaCliente[];
};

export default function ClienteHistorialVivo({ token, nombre, citas }: ClienteHistorialVivoProps) {
  const [actividades, setActividades] = useState<ActividadCliente[]>([]);
  const [citasLocales, setCitasLocales] = useState(citas);
  const [loading, setLoading] = useState(true);
  const [nuevas, setNuevas] = useState<Set<string>>(new Set());
  const idsPrevios = useRef<Set<string>>(new Set());

  useEffect(() => {
    setCitasLocales(citas);
  }, [citas]);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const data = await api.getActividadCliente(token);
      const idsActuales = new Set(data.map((a) => a.id));
      const recienLlegadas = data
        .filter((a) => !idsPrevios.current.has(a.id))
        .map((a) => a.id);

      if (idsPrevios.current.size > 0 && recienLlegadas.length > 0) {
        setNuevas(new Set(recienLlegadas));
        setTimeout(() => setNuevas(new Set()), 4000);
      }

      idsPrevios.current = idsActuales;
      setActividades(data);

      if (data.some((a) => a.tipo === "entregada")) {
        const misCitas = await api.getMisCitasCliente(token);
        setCitasLocales(misCitas);
      }
    } catch {
      if (!silencioso) setActividades([]);
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void cargar();
    const intervalo = setInterval(() => void cargar(true), POLL_MS);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const motoEntregada =
    tieneMotoEntregada(citasLocales) || actividades.some((a) => a.tipo === "entregada");

  if (loading) {
    return (
      <div className="px-4 sm:px-6 md:px-8">
        <p className="text-sm text-[#9ca3af]">Cargando actividad del taller...</p>
      </div>
    );
  }

  if (actividades.length === 0) {
    return (
      <div className="flex flex-col gap-4 px-4 sm:px-6 md:px-8 pb-6">
        <p className="text-sm text-[#9ca3af] sm:text-base max-w-2xl">
          Aún no hay actividad registrada. Cuando el técnico trabaje en tu moto, lo verás aquí en
          vivo.
        </p>
        {motoEntregada && (
          <ClienteTestimonio token={token} nombre={nombre} />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 sm:px-6 md:px-8 pb-6">
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#ff6b2c]/10 border border-[#ff6b2c]/20 px-3 py-2 sm:px-4 sm:py-2.5 lg:max-w-md">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b2c] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff6b2c]" />
        </span>
        <Radio size={14} className="text-[#ff6b2c] shrink-0" />
        <span className="text-xs font-medium text-[#ff6b2c] sm:text-sm">
          Actualización en vivo · cada {POLL_MS / 1000}s
        </span>
      </div>

      <div className="relative flex flex-col gap-0 max-w-full lg:max-w-3xl">
        {actividades.map((actividad, index) => {
          const Icono = ICONO_TIPO[actividad.tipo] ?? Wrench;
          const esNueva = nuevas.has(actividad.id);
          const enProgreso = actividad.tipo === "trabajo_progreso";
          const datos = actividad.datos;
          const fotosIngreso = datos?.fotos ?? [];
          const videosIngreso = datos?.videos ?? [];
          const fotosViejos = datos?.fotosViejos ?? [];
          const fotosNuevos = datos?.fotosNuevos ?? [];

          return (
            <article
              key={actividad.id}
              className={[
                "relative flex gap-3 pb-6",
                esNueva ? "animate-pulse-once" : "",
              ].join(" ")}
            >
              {index < actividades.length - 1 && (
                <span className="absolute left-[17px] top-9 bottom-0 w-px bg-white/10 lg:hidden" />
              )}

              <div
                className={[
                  "relative z-10 flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border",
                  esNueva
                    ? "border-[#ff6b2c] bg-[#ff6b2c]/20 text-[#ff6b2c]"
                    : "border-white/10 bg-[#161d2b] text-[#9ca3af]",
                ].join(" ")}
              >
                <Icono size={16} />
              </div>

              <div
                className={[
                  "min-w-0 flex-1 rounded-2xl border p-4 transition-colors",
                  enProgreso
                    ? "border-blue-500/30 bg-blue-500/5"
                    : esNueva
                      ? "border-[#ff6b2c]/40 bg-[#ff6b2c]/5"
                      : "border-white/5 bg-[#161d2b]",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{actividad.titulo}</p>
                  {enProgreso && (
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-300">
                      En progreso
                    </span>
                  )}
                  {esNueva && !enProgreso && (
                    <span className="rounded-full bg-[#ff6b2c] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      Nuevo
                    </span>
                  )}
                </div>

                {actividad.servicio && (
                  <p className="mt-1 text-xs text-[#ff6b2c]/80">{actividad.servicio}</p>
                )}

                {actividad.descripcion ? (
                  <p className="mt-2 text-sm text-[#9ca3af] leading-relaxed">
                    {actividad.descripcion}
                  </p>
                ) : enProgreso ? (
                  <p className="mt-2 text-sm text-[#6b7280] italic">
                    El técnico está registrando este trabajo...
                  </p>
                ) : null}

                <p className="mt-2 text-[10px] uppercase tracking-wider text-[#6b7280]">
                  {formatearFechaCompleta(actividad.createdAt)}
                </p>

                {(fotosIngreso.length > 0 || videosIngreso.length > 0) && (
                  <div className="mt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                      Registro de ingreso
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
                      {fotosIngreso.map((src) => (
                        <a
                          key={src}
                          href={urlMedia(src)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square overflow-hidden rounded-lg bg-[#0c1017]"
                        >
                          <Image
                            src={urlMedia(src)}
                            alt="Ingreso"
                            fill
                            className="object-cover"
                            sizes="100px"
                            unoptimized
                          />
                        </a>
                      ))}
                      {videosIngreso.map((src) => (
                        <a
                          key={src}
                          href={urlMedia(src)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-[#0c1017] text-[10px] text-[#9ca3af]"
                        >
                          Ver video
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {(fotosViejos.length > 0 || fotosNuevos.length > 0) && (
                  <div className="mt-3 space-y-3">
                    {fotosViejos.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                          Repuestos viejos
                        </p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
                          {fotosViejos.map((src) => (
                            <a
                              key={src}
                              href={urlMedia(src)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative aspect-square overflow-hidden rounded-lg bg-[#0c1017]"
                            >
                              <Image
                                src={urlMedia(src)}
                                alt="Repuesto viejo"
                                fill
                                className="object-cover"
                                sizes="100px"
                                unoptimized
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {fotosNuevos.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                          Repuestos nuevos
                        </p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
                          {fotosNuevos.map((src) => (
                            <a
                              key={src}
                              href={urlMedia(src)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative aspect-square overflow-hidden rounded-lg bg-[#0c1017]"
                            >
                              <Image
                                src={urlMedia(src)}
                                alt="Repuesto nuevo"
                                fill
                                className="object-cover"
                                sizes="100px"
                                unoptimized
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {motoEntregada && (
        <ClienteTestimonio token={token} nombre={nombre} />
      )}
    </div>
  );
}
