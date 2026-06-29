"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  CalendarPlus,
  Headphones,
  History,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Plus,
} from "lucide-react";
import { api, type Cliente, type ConfigTaller, type CitaCliente } from "@/src/lib/api";
import ClienteBottomNav from "./ClienteBottomNav";
import ClienteHistorialVivo from "./ClienteHistorialVivo";
import ClienteNovedades from "./ClienteNovedades";
import ReservarCitaCliente from "./ReservarCitaCliente";
import {
  citaActiva,
  etiquetaEstado,
  formatearFechaCompleta,
  formatearFechaRelativa,
  formatearHora,
  progresoServicio,
  proximaCita,
  tituloMoto,
  enlaceWhatsApp,
  type ClienteTab,
} from "./clienteUtils";

type ClienteDashboardProps = {
  nombre: string;
  token: string;
  cliente: Cliente | null;
  citas: CitaCliente[];
  loading: boolean;
  onLogout: () => void;
  onCitaReservada: () => void;
};

export default function ClienteDashboard({
  nombre,
  token,
  cliente,
  citas,
  loading,
  onLogout,
  onCitaReservada,
}: ClienteDashboardProps) {
  const [tab, setTab] = useState<ClienteTab>("panel");
  const [config, setConfig] = useState<ConfigTaller | null>(null);

  useEffect(() => {
    api.getConfig().then(setConfig).catch(() => null);
  }, []);

  const primerNombre = nombre.split(" ")[0];
  const activa = citaActiva(citas);
  const siguiente = proximaCita(citas);
  const progreso = activa ? progresoServicio(activa.estado) : 0;

  const whatsappUrl = config?.whatsapp
    ? enlaceWhatsApp(
        config.whatsapp,
        `Hola, soy ${nombre}. Tengo una consulta sobre mi moto en el taller.`,
      )
    : "/#contacto";

  return (
    <div className="min-h-screen bg-[#0c1017] text-white overflow-x-hidden">
      <div className="mx-auto min-h-screen w-full md:pl-60 lg:pl-64 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8">
        <div className="mx-auto w-full max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl">
          {/* Header — solo móvil */}
          <header className="flex items-center justify-between px-4 pt-5 pb-4 sm:px-6 md:hidden">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ff6b2c]/20 text-sm font-bold text-[#ff6b2c]">
                {primerNombre.charAt(0).toUpperCase()}
              </div>
              <span className="truncate text-sm font-semibold tracking-wide text-white/90">
                Moto Taller
              </span>
            </div>
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#9ca3af]"
              aria-label="Notificaciones"
            >
              <Bell size={18} />
            </button>
          </header>

          {/* Saludo */}
          <section className="px-4 pb-5 sm:px-6 md:px-8 md:pt-8 lg:pb-8">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Hola, {primerNombre}
            </h1>
            <p className="mt-1 text-sm text-[#9ca3af] sm:text-base">
              Tu motocicleta está en las mejores manos
            </p>
          </section>

          {loading ? (
            <p className="px-4 sm:px-6 md:px-8 text-sm text-[#9ca3af]">Cargando tu información...</p>
          ) : (
            <>
              {tab === "panel" && (
                <PanelTab
                  activa={activa}
                  siguiente={siguiente}
                  progreso={progreso}
                  whatsappUrl={whatsappUrl}
                  token={token}
                  cliente={cliente}
                  onGoHistorial={() => setTab("historial")}
                  onGoCitas={() => setTab("citas")}
                />
              )}

              {tab === "historial" && (
                <ClienteHistorialVivo
                  token={token}
                  nombre={nombre}
                  citas={citas}
                />
              )}

              {tab === "citas" && (
                <CitasTab
                  citas={citas}
                  siguiente={siguiente}
                  token={token}
                  cliente={cliente}
                  onCitaReservada={onCitaReservada}
                />
              )}

              {tab === "taller" && <TallerTab config={config} />}

              {tab === "perfil" && (
                <PerfilTab cliente={cliente} nombre={nombre} onLogout={onLogout} />
              )}
            </>
          )}
        </div>
      </div>

      <ClienteBottomNav activo={tab} onChange={setTab} nombre={nombre} />
    </div>
  );
}

function PanelTab({
  activa,
  siguiente,
  progreso,
  whatsappUrl,
  token,
  cliente,
  onGoHistorial,
  onGoCitas,
}: {
  activa: CitaCliente | null;
  siguiente: CitaCliente | null;
  progreso: number;
  whatsappUrl: string;
  token: string;
  cliente: Cliente | null;
  onGoHistorial: () => void;
  onGoCitas: () => void;
}) {
  return (
    <div className="flex flex-col gap-5 px-4 sm:px-6 md:px-8 pb-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        {/* Estado de la moto */}
        <article className="overflow-hidden rounded-2xl bg-[#161d2b] border border-white/5 lg:row-span-2">
        <div className="flex items-start justify-between gap-3 p-4 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ff6b2c]/80">
            Estado de la moto
          </p>
          {activa && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff6b2c]/15 px-2.5 py-1 text-[10px] font-medium text-[#ff6b2c]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b2c]" />
              {etiquetaEstado(activa.estado)}
            </span>
          )}
        </div>

        {activa ? (
          <>
            <h2 className="px-4 text-lg font-bold sm:text-xl">{tituloMoto(activa)}</h2>
            <div className="relative mx-4 mt-3 mb-4 aspect-[16/10] sm:aspect-[16/9] overflow-hidden rounded-xl bg-[#0c1017]">
              <Image
                src="/8.png"
                alt="Moto en taller"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="px-4 pb-5">
              <div className="mb-2 flex items-center justify-between text-xs text-[#9ca3af]">
                <span>Progreso del servicio</span>
                <span className="font-semibold text-white">{progreso}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ff6b2c] to-[#ff8f4c] transition-all duration-500"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="px-4 pb-5">
            <p className="text-sm text-[#9ca3af] mb-4">
              No tienes una moto en servicio actualmente.
            </p>
            {cliente ? (
              <button
                type="button"
                onClick={onGoCitas}
                className="inline-flex items-center justify-center w-full rounded-xl bg-[#ff6b2c] py-3 text-sm font-semibold text-white"
              >
                Reservar tu primera cita
              </button>
            ) : (
              <Link
                href="/#contacto"
                className="inline-flex items-center justify-center w-full rounded-xl bg-[#ff6b2c] py-3 text-sm font-semibold text-white"
              >
                Reservar tu primera cita
              </Link>
            )}
          </div>
        )}
      </article>

        {/* Próxima cita */}
        {siguiente && (
          <article className="rounded-2xl bg-[#161d2b] border border-white/5 p-4 sm:p-5 h-fit">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#ff6b2c]/15 text-[#ff6b2c]">
                <CalendarPlus size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">
                  Próxima cita
                </p>
                <p className="mt-1 text-sm text-white/80 sm:text-base">
                  {formatearFechaRelativa(siguiente.fechaPreferida)}
                </p>
                <p className="text-2xl font-bold text-[#ff6b2c] sm:text-3xl lg:text-4xl">
                  {formatearHora(siguiente.fechaPreferida)}
                </p>
                <p className="mt-2 text-sm text-[#9ca3af] leading-relaxed">
                  {siguiente.servicio?.titulo ?? "Servicio en taller"}
                </p>
              </div>
            </div>
            <Link
              href="/#contacto"
              className="mt-4 flex w-full items-center justify-center rounded-xl border border-white/15 py-2.5 sm:py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/5"
            >
              Añadir al calendario
            </Link>
          </article>
        )}
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <button
          type="button"
          onClick={onGoCitas}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#ff6b2c] py-3.5 sm:py-4 text-sm font-semibold text-white shadow-lg shadow-[#ff6b2c]/20"
        >
          <Plus size={18} />
          Reservar cita
        </button>
        <button
          type="button"
          onClick={onGoHistorial}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#161d2b] border border-white/5 py-3.5 sm:py-4 text-sm font-medium text-white/90"
        >
          <History size={18} className="text-[#9ca3af] shrink-0" />
          <span className="truncate">Historial</span>
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#161d2b] border border-white/5 py-3.5 sm:py-4 text-sm font-medium text-white/90"
        >
          <Headphones size={18} className="text-[#9ca3af] shrink-0" />
          <span className="truncate">Mecánico</span>
        </a>
      </div>

      {/* Novedades */}
      <ClienteNovedades token={token} />
    </div>
  );
}

function CitasTab({
  citas,
  siguiente,
  token,
  cliente,
  onCitaReservada,
}: {
  citas: CitaCliente[];
  siguiente: CitaCliente | null;
  token: string;
  cliente: Cliente | null;
  onCitaReservada: () => void;
}) {
  const pendientes = citas.filter((c) => c.estado !== "entregada" && c.estado !== "cancelada");

  return (
    <div className="flex flex-col gap-5 px-4 sm:px-6 md:px-8 pb-6">
      {cliente && (
        <ReservarCitaCliente
          token={token}
          cliente={cliente}
          onReservada={onCitaReservada}
        />
      )}

      {siguiente && (
        <article className="rounded-2xl bg-gradient-to-br from-[#ff6b2c]/20 to-[#161d2b] border border-[#ff6b2c]/30 p-5 sm:p-6 lg:max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ff6b2c] sm:text-xs">
            Próxima cita
          </p>
          <p className="mt-2 text-xl font-bold sm:text-2xl">
            {formatearFechaRelativa(siguiente.fechaPreferida)}
          </p>
          <p className="text-3xl font-bold text-[#ff6b2c] sm:text-4xl lg:text-5xl">
            {formatearHora(siguiente.fechaPreferida)}
          </p>
          <p className="mt-2 text-sm text-[#9ca3af] sm:text-base">
            {siguiente.servicio?.titulo ?? "Servicio en taller"}
          </p>
        </article>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-white/80 sm:text-base">Todas tus citas</h3>
        {pendientes.length === 0 ? (
          <p className="text-sm text-[#9ca3af] mb-4">No tienes citas activas.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendientes.map((cita) => (
              <article
                key={cita.id}
                className="rounded-2xl bg-[#161d2b] border border-white/5 p-4"
              >
                <p className="font-medium">{cita.servicio?.titulo ?? "Servicio"}</p>
                <p className="text-sm text-[#9ca3af] mt-1">
                  {formatearFechaCompleta(cita.fechaPreferida)}
                </p>
                <span className="mt-2 inline-block text-xs text-[#ff6b2c]">
                  {etiquetaEstado(cita.estado)}
                </span>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TallerTab({ config }: { config: ConfigTaller | null }) {
  return (
    <div className="flex flex-col gap-4 px-4 sm:px-6 md:px-8 pb-6 lg:max-w-3xl">
      <article className="rounded-2xl bg-[#161d2b] border border-white/5 p-5 sm:p-6">
        <h2 className="text-lg font-bold mb-4 sm:text-xl">Moto Taller Familiar</h2>
        {config ? (
          <div className="grid grid-cols-1 gap-4 text-sm sm:text-base sm:grid-cols-2">
            {config.direccion && (
              <div className="flex gap-3 text-[#9ca3af]">
                <MapPin size={18} className="shrink-0 text-[#ff6b2c]" />
                <span>{config.direccion}</span>
              </div>
            )}
            {config.telefono && (
              <div className="flex gap-3 text-[#9ca3af]">
                <Phone size={18} className="shrink-0 text-[#ff6b2c]" />
                <a href={`tel:${config.telefono}`} className="hover:text-white">
                  {config.telefono}
                </a>
              </div>
            )}
            {config.horario && (
              <div className="flex gap-3 text-[#9ca3af]">
                <CalendarPlus size={18} className="shrink-0 text-[#ff6b2c]" />
                <span>{config.horario}</span>
              </div>
            )}
            {config.whatsapp && (
              <a
                href={enlaceWhatsApp(config.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="sm:col-span-2 mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#25d366]/20 border border-[#25d366]/40 py-3 font-medium text-[#25d366]"
              >
                Escribir por WhatsApp
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#9ca3af]">Cargando información del taller...</p>
        )}
      </article>

      <Link
        href="/"
        className="flex items-center justify-center rounded-2xl border border-white/10 py-3 text-sm text-[#9ca3af] hover:text-white"
      >
        Ver sitio web del taller
      </Link>
    </div>
  );
}

function PerfilTab({
  cliente,
  nombre,
  onLogout,
}: {
  cliente: Cliente | null;
  nombre: string;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 px-4 sm:px-6 md:px-8 pb-6 lg:max-w-lg">
      <article className="rounded-2xl bg-[#161d2b] border border-white/5 p-5 sm:p-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#ff6b2c]/20 text-2xl sm:text-3xl font-bold text-[#ff6b2c]">
          {nombre.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold">{nombre}</h2>
        {cliente && (
          <div className="mt-4 flex flex-col gap-2 text-sm text-[#9ca3af]">
            <div className="flex items-center justify-center gap-2">
              <Mail size={14} />
              {cliente.email}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Phone size={14} />
              {cliente.telefono}
            </div>
          </div>
        )}
      </article>

      <button
        type="button"
        onClick={onLogout}
        className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 py-3.5 text-sm font-medium text-red-400"
      >
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </div>
  );
}
