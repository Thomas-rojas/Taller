"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Bike, Calendar, KeyRound, Lock, LogOut, PackageCheck, PackageOpen, Search, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api, type Cita } from "@/src/lib/api";
import { hoyISO } from "@/src/lib/fechas";

const STORAGE_KEY = "moto-taller-mecanico-key";

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  recibida: "En taller",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "text-yellow-400",
  confirmada: "text-blue-400",
  recibida: "text-orange-400",
  entregada: "text-green-400",
  cancelada: "text-gray-500",
};

function fechaRecepcionISO(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatearFecha(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MecanicoPage() {
  const [apiKey, setApiKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(
    null,
  );
  const [fechasEntrega, setFechasEntrega] = useState<Record<string, string>>({});
  const [recepcionForm, setRecepcionForm] = useState<
    Record<string, { placa: string; descripcionTrabajo: string }>
  >({});
  const [busquedaFecha, setBusquedaFecha] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) setApiKey(saved);
  }, []);

  const cargarCitas = useCallback(async (key: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await api.getCitas(key);
      setCitas(data);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudieron cargar las citas",
      });
      if (error instanceof Error && error.message.includes("401")) {
        sessionStorage.removeItem(STORAGE_KEY);
        setApiKey("");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (apiKey) cargarCitas(apiKey);
  }, [apiKey, cargarCitas]);

  const iniciarSesion = (e: React.FormEvent) => {
    e.preventDefault();
    const key = inputKey.trim();
    if (!key) return;
    sessionStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setApiKey("");
    setCitas([]);
    setInputKey("");
  };

  const recibirMoto = async (cita: Cita) => {
    if (!apiKey) return;
    const datos = recepcionForm[cita.id] ?? { placa: "", descripcionTrabajo: "" };

    if (!datos.placa.trim()) {
      setFeedback({ type: "error", text: "Ingresa la placa de la moto." });
      return;
    }
    if (!datos.descripcionTrabajo.trim()) {
      setFeedback({ type: "error", text: "Describe el trabajo realizado en la moto." });
      return;
    }

    setFeedback(null);
    try {
      const result = await api.recibirMoto(apiKey, cita.id, {
        placa: datos.placa.trim(),
        descripcionTrabajo: datos.descripcionTrabajo.trim(),
      });
      setFeedback({ type: "ok", text: result.message });
      await cargarCitas(apiKey);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo registrar la recepción",
      });
    }
  };

  const entregarMoto = async (cita: Cita) => {
    if (!apiKey) return;
    const fechaEntrega = fechasEntrega[cita.id] || hoyISO();
    setFeedback(null);
    try {
      const result = await api.entregarMoto(apiKey, cita.id, fechaEntrega);
      setFeedback({ type: "ok", text: result.message });
      await cargarCitas(apiKey);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo registrar la entrega",
      });
    }
  };

  const citasFiltradas = busquedaFecha
    ? citas.filter((cita) => fechaRecepcionISO(cita.fechaRecepcion) === busquedaFecha)
    : citas;

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <form
          onSubmit={iniciarSesion}
          className="w-full max-w-md bg-[#1a1a1a] rounded-3xl p-8 flex flex-col gap-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <Bike className="text-orange-500" size={32} />
            <div>
              <h1 className="text-2xl font-bold">Panel del mecánico</h1>
              <p className="text-gray-400 text-sm">Acceso restringido</p>
            </div>
          </div>
          <label className="text-sm text-gray-400">Clave de acceso</label>
          <div className="relative">
            <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="MECHANIC_API_KEY"
              className="w-full bg-[#262626] rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-full transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Bike className="text-orange-500" size={32} />
            <div>
              <h1 className="text-3xl font-bold">Panel del mecánico</h1>
              <p className="text-gray-400">Recepción, entrega y bloqueo de calendario</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Volver al sitio
            </Link>
            <button
              onClick={cerrarSesion}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>
        </div>

        {feedback && (
          <p
            className={`mb-6 text-sm ${feedback.type === "ok" ? "text-green-400" : "text-red-400"}`}
          >
            {feedback.text}
          </p>
        )}

        <div className="mb-6 bg-gradient-to-r from-orange-500/20 to-amber-600/10 border border-orange-500/40 rounded-2xl p-4 md:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-orange-300 flex items-center gap-2 mb-2 font-medium">
                <Search size={16} />
                Buscar por fecha de ingreso al taller
              </label>
              <input
                type="date"
                value={busquedaFecha}
                onChange={(e) => setBusquedaFecha(e.target.value)}
                className="w-full bg-[#1a1a1a] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 border border-gray-700"
              />
            </div>
            {busquedaFecha && (
              <button
                type="button"
                onClick={() => setBusquedaFecha("")}
                className="flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors"
              >
                <X size={16} />
                Limpiar
              </button>
            )}
          </div>
          {busquedaFecha && (
            <p className="text-xs text-gray-400 mt-3">
              Mostrando motos que ingresaron el{" "}
              {new Date(`${busquedaFecha}T12:00:00`).toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {" "}({citasFiltradas.length} resultado{citasFiltradas.length !== 1 ? "s" : ""})
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-gray-400">Cargando citas...</p>
        ) : citas.length === 0 ? (
          <p className="text-gray-400">No hay citas registradas.</p>
        ) : citasFiltradas.length === 0 ? (
          <p className="text-gray-400">No hay motos ingresadas en esa fecha.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {citasFiltradas.map((cita) => (
              <div key={cita.id} className="bg-[#1a1a1a] rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{cita.nombre}</h2>
                    <p className="text-gray-400 text-sm">{cita.telefono}</p>
                    {cita.servicio && (
                      <p className="text-orange-400 text-sm mt-1">{cita.servicio.titulo}</p>
                    )}
                  </div>
                  <span className={`font-medium ${ESTADO_COLOR[cita.estado] ?? "text-gray-400"}`}>
                    {ESTADO_LABEL[cita.estado] ?? cita.estado}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-[#262626] rounded-xl p-3">
                    <p className="text-gray-400">Cita solicitada</p>
                    <p>{formatearFecha(cita.fechaPreferida)}</p>
                  </div>
                  <div className="bg-[#262626] rounded-xl p-3">
                    <p className="text-gray-400">Recepción</p>
                    <p>{formatearFecha(cita.fechaRecepcion)}</p>
                  </div>
                  <div className="bg-[#262626] rounded-xl p-3">
                    <p className="text-gray-400">Entrega real</p>
                    <p>{formatearFecha(cita.fechaEntregaReal)}</p>
                  </div>
                </div>

                {(cita.datosReparacionBloqueados || cita.placa) && (
                  <div className="bg-[#262626] rounded-xl p-4 flex flex-col gap-3 border border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Lock size={14} />
                      Datos de reparación (solo lectura)
                    </div>
                    {cita.placa ? (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Placa</p>
                          <input
                            readOnly
                            disabled
                            value={cita.placa}
                            className="w-full bg-[#1a1a1a] rounded-lg px-3 py-2 text-white opacity-80 cursor-not-allowed uppercase"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Trabajo realizado</p>
                          <textarea
                            readOnly
                            disabled
                            rows={3}
                            value={cita.descripcionTrabajo ?? ""}
                            className="w-full bg-[#1a1a1a] rounded-lg px-3 py-2 text-white opacity-80 cursor-not-allowed resize-none"
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Datos registrados por otro usuario. Solo un administrador puede verlos.
                      </p>
                    )}
                  </div>
                )}

                {(cita.estado === "pendiente" || cita.estado === "confirmada") && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">
                        Placa de la moto <span className="text-orange-400">*</span>
                      </label>
                      <input
                        required
                        placeholder="Ej: ABC123"
                        value={recepcionForm[cita.id]?.placa ?? ""}
                        onChange={(e) =>
                          setRecepcionForm((prev) => ({
                            ...prev,
                            [cita.id]: {
                              placa: e.target.value.toUpperCase(),
                              descripcionTrabajo: prev[cita.id]?.descripcionTrabajo ?? "",
                            },
                          }))
                        }
                        className="w-full bg-[#262626] rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">
                        Descripción del trabajo <span className="text-orange-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Detalla las reparaciones a realizar o el diagnóstico inicial..."
                        value={recepcionForm[cita.id]?.descripcionTrabajo ?? ""}
                        onChange={(e) =>
                          setRecepcionForm((prev) => ({
                            ...prev,
                            [cita.id]: {
                              placa: prev[cita.id]?.placa ?? "",
                              descripcionTrabajo: e.target.value,
                            },
                          }))
                        }
                        className="w-full bg-[#262626] rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                      />
                    </div>
                    <button
                      onClick={() => recibirMoto(cita)}
                      className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-full transition-colors w-fit"
                    >
                      <PackageOpen size={18} />
                      Recibir moto (bloquear mes)
                    </button>
                    <p className="text-xs text-gray-500">
                      Al confirmar, la placa y la descripción quedarán bloqueadas y no podrán
                      editarse.
                    </p>
                  </div>
                )}

                {cita.estado === "recibida" && (
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                        <Calendar size={14} />
                        Fecha de entrega
                      </label>
                      <input
                        type="date"
                        value={fechasEntrega[cita.id] ?? hoyISO()}
                        onChange={(e) =>
                          setFechasEntrega((prev) => ({ ...prev, [cita.id]: e.target.value }))
                        }
                        className="bg-[#262626] rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <button
                      onClick={() => entregarMoto(cita)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-full transition-colors"
                    >
                      <PackageCheck size={18} />
                      Marcar como entregada
                    </button>
                    <p className="text-xs text-gray-500 w-full">
                      Libera automáticamente los días posteriores a la entrega. Solo quedan
                      ocupados los días en que la moto estuvo en el taller.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
