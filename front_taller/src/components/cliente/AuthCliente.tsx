"use client";

import React, { useState } from "react";
import { User } from "lucide-react";
import { api } from "@/src/lib/api";

const inputClass =
  "w-full bg-[#161d2b] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-[#6b7280] outline-none focus:border-[#ff6b2c] transition-colors";

type AuthClienteProps = {
  onLogin: (token: string, nombre: string) => void;
};

export default function AuthCliente({ onLogin }: AuthClienteProps) {
  const [tab, setTab] = useState<"login" | "registro">("login");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registroForm, setRegistroForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const result = await api.loginCliente(loginForm);
      onLogin(result.token, result.cliente.nombre);
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
      const result = await api.registrarCliente(registroForm);
      onLogin(result.token, result.cliente.nombre);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo completar el registro",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1017] text-white flex flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12 md:py-16">
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#ff6b2c]/15 mb-5">
            <User size={24} strokeWidth={1.5} className="text-[#ff6b2c] sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">
            {tab === "login" ? "Inicia sesión" : "Crea tu cuenta"}
          </h1>
          <p className="text-sm text-[#9ca3af]">
            {tab === "login"
              ? "Consulta el estado de tus citas y el servicio de tu moto."
              : "Regístrate para seguir tus citas en el taller."}
          </p>
        </div>

        <div className="flex border-b border-white/10 mb-8">
          {(["login", "registro"] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => {
                setTab(opcion);
                setFeedback(null);
              }}
              className={[
                "flex-1 pb-3 text-xs uppercase tracking-[0.2em] transition-colors",
                tab === opcion
                  ? "text-[#ff6b2c] border-b-2 border-[#ff6b2c] font-semibold"
                  : "text-[#6b7280] hover:text-[#9ca3af]",
              ].join(" ")}
            >
              {opcion === "login" ? "Iniciar sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              required
              type="email"
              placeholder="Correo electrónico"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              className={inputClass}
            />
            <input
              required
              type="password"
              placeholder="Contraseña"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6b2c] hover:bg-[#e85d22] disabled:opacity-50 text-white text-sm font-semibold py-3.5 mt-2 rounded-xl transition-colors"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegistro} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                required
                type="text"
                placeholder="Nombre completo"
                value={registroForm.nombre}
                onChange={(e) => setRegistroForm({ ...registroForm, nombre: e.target.value })}
                className={`${inputClass} sm:col-span-2`}
              />
              <input
                required
                type="tel"
                placeholder="Teléfono"
                value={registroForm.telefono}
                onChange={(e) => setRegistroForm({ ...registroForm, telefono: e.target.value })}
                className={inputClass}
              />
              <input
                required
                type="email"
                placeholder="Correo electrónico"
                value={registroForm.email}
                onChange={(e) => setRegistroForm({ ...registroForm, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <input
              required
              type="password"
              minLength={6}
              placeholder="Contraseña (mín. 6 caracteres)"
              value={registroForm.password}
              onChange={(e) => setRegistroForm({ ...registroForm, password: e.target.value })}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6b2c] hover:bg-[#e85d22] disabled:opacity-50 text-white text-sm font-semibold py-3.5 sm:py-4 mt-2 rounded-xl transition-colors"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        )}

        {feedback && (
          <p
            className={`mt-6 text-sm text-center ${feedback.type === "ok" ? "text-[#9ca3af]" : "text-red-400"}`}
          >
            {feedback.text}
          </p>
        )}
      </div>
    </div>
  );
}
