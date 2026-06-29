"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Cliente, type CitaCliente } from "@/src/lib/api";
import AuthCliente from "@/src/components/cliente/AuthCliente";
import ClienteDashboard from "@/src/components/cliente/ClienteDashboard";

const STORAGE_KEY = "moto-taller-cliente-token";
const STORAGE_NOMBRE = "moto-taller-cliente-nombre";

export default function ClientePage() {
  const [token, setToken] = useState("");
  const [nombre, setNombre] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [citas, setCitas] = useState<CitaCliente[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    const savedNombre = sessionStorage.getItem(STORAGE_NOMBRE);
    if (saved) setToken(saved);
    if (savedNombre) setNombre(savedNombre);
  }, []);

  const cargarDatos = useCallback(async (authToken: string) => {
    setLoading(true);
    try {
      const [perfil, misCitas] = await Promise.all([
        api.getPerfilCliente(authToken),
        api.getMisCitasCliente(authToken),
      ]);
      setCliente(perfil.cliente);
      setNombre(perfil.cliente.nombre);
      setCitas(misCitas);
      sessionStorage.setItem(STORAGE_NOMBRE, perfil.cliente.nombre);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_NOMBRE);
      setToken("");
      setNombre("");
      setCliente(null);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) void cargarDatos(token);
  }, [token, cargarDatos]);

  const handleLogin = (authToken: string, nombreCliente: string) => {
    sessionStorage.setItem(STORAGE_KEY, authToken);
    sessionStorage.setItem(STORAGE_NOMBRE, nombreCliente);
    setToken(authToken);
    setNombre(nombreCliente);
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await api.logoutCliente(token);
      } catch {
        // Ignorar error al cerrar sesión
      }
    }
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_NOMBRE);
    setToken("");
    setNombre("");
    setCliente(null);
    setCitas([]);
  };

  if (!token) {
    return <AuthCliente onLogin={handleLogin} />;
  }

  return (
    <ClienteDashboard
      nombre={nombre}
      token={token}
      cliente={cliente}
      citas={citas}
      loading={loading}
      onLogout={handleLogout}
      onCitaReservada={() => {
        if (token) void cargarDatos(token);
      }}
    />
  );
}
