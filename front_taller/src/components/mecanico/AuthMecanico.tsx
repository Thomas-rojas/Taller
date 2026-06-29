"use client";

import React, { useState } from "react";
import { Bike } from "lucide-react";
import Link from "next/link";
import { api } from "@/src/lib/api";

const TIPOS_IDENTIFICACION = [
  { value: "cedula", label: "Cédula" },
  { value: "pasaporte", label: "Pasaporte" },
  { value: "cedula_extranjeria", label: "Cédula extranjería" },
  { value: "tarjeta_identidad", label: "Tarjeta de identidad" },
];

const inputClass =
  "w-full bg-[#262626] border border-[#333] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#e8774a] focus:border-transparent";

type AuthScreenProps = {
  onLogin: (token: string, nombre?: string) => void;
};

export default function AuthMecanico({ onLogin }: AuthScreenProps) {
  const [tab, setTab] = useState<"login" | "registro">("login");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", identificacion: "" });
  const [registroForm, setRegistroForm] = useState({
    email: "",
    nombre: "",
    apellidos: "",
    celular: "",
    direccion: "",
    tipoIdentificacion: "cedula",
    identificacion: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const result = await api.loginMecanico(loginForm);
      onLogin(result.token, `${result.mecanico.nombre} ${result.mecanico.apellidos}`);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo iniciar sesión",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const result = await api.registrarMecanico(registroForm);
      const avisoCorreo =
        result.correoEnviado === false && result.correoError
          ? ` ${result.correoError}`
          : "";
      setFeedback({ type: "ok", text: `${result.message}${avisoCorreo}` });
      setTab("login");
      setLoginForm((prev) => ({ ...prev, email: registroForm.email }));
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo completar el registro",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const key = adminKey.trim();
    if (!key) return;
    onLogin(key);
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Bike className="text-[#e8774a] shrink-0" size={28} />
          <div>
            <h1 className="text-xl font-semibold tracking-wide">Ingresa o regístrate</h1>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              Panel exclusivo de mecánicos. Completa tus datos para solicitar acceso.
            </p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl p-4 sm:p-6 md:p-8 border border-[#2a2a2a]">
          <div className="flex rounded-xl overflow-hidden mb-6 bg-[#262626] p-1">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setFeedback(null);
              }}
              className={[
                "flex-1 py-2.5 text-xs uppercase tracking-widest rounded-lg transition-colors",
                tab === "login"
                  ? "bg-[#e8774a] text-white font-semibold"
                  : "text-gray-400 hover:text-white",
              ].join(" ")}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("registro");
                setFeedback(null);
              }}
              className={[
                "flex-1 py-2.5 text-xs uppercase tracking-widest rounded-lg transition-colors",
                tab === "registro"
                  ? "bg-[#e8774a] text-white font-semibold"
                  : "text-gray-400 hover:text-white",
              ].join(" ")}
            >
              Registrarme
            </button>
          </div>

          {feedback && (
            <p
              className={`mb-4 text-sm leading-relaxed ${feedback.type === "ok" ? "text-green-400" : "text-red-400"}`}
            >
              {feedback.text}
            </p>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-1.5 block">Email *</label>
                <input
                  required
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                  className={inputClass}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1.5 block">Contraseña *</label>
                <input
                  required
                  type="password"
                  value={loginForm.identificacion}
                  onChange={(e) =>
                    setLoginForm((p) => ({ ...p, identificacion: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Tu contraseña"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#e8774a] hover:bg-[#d4693e] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegistro} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-1.5 block">Nombre *</label>
                <input
                  required
                  value={registroForm.nombre}
                  onChange={(e) => setRegistroForm((p) => ({ ...p, nombre: e.target.value }))}
                  className={inputClass}
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1.5 block">Apellidos *</label>
                <input
                  required
                  value={registroForm.apellidos}
                  onChange={(e) => setRegistroForm((p) => ({ ...p, apellidos: e.target.value }))}
                  className={inputClass}
                  placeholder="Tus apellidos"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1.5 block">Email *</label>
                <input
                  required
                  type="email"
                  value={registroForm.email}
                  onChange={(e) => setRegistroForm((p) => ({ ...p, email: e.target.value }))}
                  className={inputClass}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1.5 block">Celular *</label>
                <input
                  required
                  type="tel"
                  value={registroForm.celular}
                  onChange={(e) => setRegistroForm((p) => ({ ...p, celular: e.target.value }))}
                  className={inputClass}
                  placeholder="Ej: 3144902016"
                  minLength={10}
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1.5 block">Dirección de vivienda *</label>
                <textarea
                  required
                  rows={2}
                  value={registroForm.direccion}
                  onChange={(e) => setRegistroForm((p) => ({ ...p, direccion: e.target.value }))}
                  className={`${inputClass} resize-none`}
                  placeholder="Ej: Calle 10 # 25-30, Barrio Centro"
                  minLength={5}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-300 mb-1.5 block">Tipo de identificación *</label>
                  <select
                    required
                    value={registroForm.tipoIdentificacion}
                    onChange={(e) =>
                      setRegistroForm((p) => ({ ...p, tipoIdentificacion: e.target.value }))
                    }
                    className={inputClass}
                  >
                    {TIPOS_IDENTIFICACION.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1.5 block">Identificación *</label>
                  <input
                    required
                    value={registroForm.identificacion}
                    onChange={(e) =>
                      setRegistroForm((p) => ({ ...p, identificacion: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="Ej: 1234567890"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Tras registrarte, un administrador revisará tu solicitud y te dará acceso al panel.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#e8774a] hover:bg-[#d4693e] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
            ← Volver al sitio
          </Link>
        </div>

        <div className="mt-8 border-t border-[#2a2a2a] pt-6">
          <button
            type="button"
            onClick={() => setShowAdmin(!showAdmin)}
            className="text-xs text-gray-600 hover:text-gray-400 uppercase tracking-widest w-full text-center"
          >
            Acceso administrador
          </button>
          {showAdmin && (
            <form onSubmit={handleAdminLogin} className="mt-4 flex flex-col gap-3">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Clave de administrador"
                className={inputClass}
              />
              <button
                type="submit"
                className="w-full border border-[#444] hover:border-[#e8774a] text-sm py-2.5 rounded-xl transition-colors"
              >
                Entrar como admin
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
