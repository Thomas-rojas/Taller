"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Wrench } from "lucide-react";
import { esDomingo, hoyISO, toISODate } from "@/src/lib/fechas";
import type { RecepcionCalendario } from "@/src/lib/api";

type Props = {
  value: string;
  onChange: (iso: string) => void;
  fechasBloqueadas: string[];
  recepciones?: RecepcionCalendario[];
};

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

function inicioMes(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

function diasEnMes(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
}

export default function DatePickerCita({
  value,
  onChange,
  fechasBloqueadas,
  recepciones = [],
}: Props) {
  const hoy = hoyISO();
  const bloqueadas = useMemo(() => new Set(fechasBloqueadas), [fechasBloqueadas]);

  const recepcionesPorFecha = useMemo(() => {
    const mapa = new Map<string, RecepcionCalendario[]>();
    for (const recepcion of recepciones) {
      const lista = mapa.get(recepcion.fecha) ?? [];
      lista.push(recepcion);
      mapa.set(recepcion.fecha, lista);
    }
    return mapa;
  }, [recepciones]);

  const [mesVisible, setMesVisible] = useState(() => {
    const base = value ? new Date(`${value}T12:00:00`) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const celdas = useMemo(() => {
    const primerDia = inicioMes(mesVisible);
    const totalDias = diasEnMes(mesVisible);
    const offset = (primerDia.getDay() + 6) % 7;
    const items: Array<{ iso: string; dia: number } | null> = [];

    for (let i = 0; i < offset; i++) items.push(null);
    for (let dia = 1; dia <= totalDias; dia++) {
      const fecha = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), dia);
      items.push({ iso: toISODate(fecha), dia });
    }

    return items;
  }, [mesVisible]);

  const tituloMes = mesVisible.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });

  const cambiarMes = (delta: number) => {
    setMesVisible((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const esDeshabilitada = (iso: string) =>
    iso < hoy || esDomingo(iso) || bloqueadas.has(iso);

  return (
    <div className="bg-[#262626] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => cambiarMes(-1)}
          className="p-2 rounded-lg hover:bg-[#333] transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-semibold capitalize">{tituloMes}</p>
        <button
          type="button"
          onClick={() => cambiarMes(1)}
          className="p-2 rounded-lg hover:bg-[#333] transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DIAS_SEMANA.map((dia) => (
          <span key={dia} className="text-center text-xs text-gray-400 py-1">
            {dia}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celdas.map((celda, index) => {
          if (!celda) {
            return <span key={`empty-${index}`} />;
          }

          const deshabilitada = esDeshabilitada(celda.iso);
          const seleccionada = value === celda.iso;
          const bloqueada = bloqueadas.has(celda.iso);
          const recepcionesDia = recepcionesPorFecha.get(celda.iso) ?? [];
          const esRecepcion = recepcionesDia.length > 0;

          return (
            <button
              key={celda.iso}
              type="button"
              disabled={deshabilitada}
              onClick={() => onChange(celda.iso)}
              title={
                esRecepcion
                  ? `Moto recibida: ${recepcionesDia.map((r) => r.nombre).join(", ")}`
                  : bloqueada
                    ? "Fecha no disponible (taller con capacidad completa)"
                    : esDomingo(celda.iso)
                      ? "Domingo — no hay atención"
                      : undefined
              }
              className={[
                "relative aspect-square rounded-lg text-sm transition-colors flex flex-col items-center justify-center gap-0.5",
                seleccionada
                  ? "bg-orange-500 text-white font-bold"
                  : esRecepcion
                    ? "bg-amber-500/25 text-amber-200 ring-1 ring-amber-500/60 cursor-not-allowed"
                    : deshabilitada
                      ? "text-gray-600 cursor-not-allowed"
                      : "hover:bg-orange-500/20 text-white",
                bloqueada && !seleccionada && !esRecepcion ? "line-through opacity-50" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span>{celda.dia}</span>
              {esRecepcion && (
                <Wrench size={10} className={seleccionada ? "text-white" : "text-amber-400"} />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-amber-500/40 ring-1 ring-amber-500/60" />
          Moto recibida en taller
        </span>
        <span>Fechas tachadas = no disponibles</span>
      </div>
    </div>
  );
}
