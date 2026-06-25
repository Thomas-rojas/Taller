"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type RecepcionCalendario } from "@/src/lib/api";

const INTERVALO_MS = 10_000;

export function useCalendarioDisponibilidad() {
  const [fechasBloqueadas, setFechasBloqueadas] = useState<string[]>([]);
  const [recepciones, setRecepciones] = useState<RecepcionCalendario[]>([]);
  const [actualizadoEn, setActualizadoEn] = useState<Date | null>(null);

  const refrescar = useCallback(async () => {
    try {
      const data = await api.getCalendarioDisponibilidad();
      setFechasBloqueadas(data.fechas);
      setRecepciones(data.recepciones);
      setActualizadoEn(new Date());
    } catch {
      /* silencioso: el calendario sigue con la última data válida */
    }
  }, []);

  useEffect(() => {
    refrescar();

    const intervalo = setInterval(refrescar, INTERVALO_MS);

    const alVolverVisible = () => {
      if (document.visibilityState === "visible") refrescar();
    };

    document.addEventListener("visibilitychange", alVolverVisible);
    window.addEventListener("focus", refrescar);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolverVisible);
      window.removeEventListener("focus", refrescar);
    };
  }, [refrescar]);

  return { fechasBloqueadas, recepciones, actualizadoEn, refrescar };
}
