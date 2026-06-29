"use client";

import { Calendar, History, LayoutDashboard, User, Wrench } from "lucide-react";
import type { ClienteTab } from "./clienteUtils";

const TABS: { id: ClienteTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "panel", label: "Panel", icon: LayoutDashboard },
  { id: "historial", label: "Historial", icon: History },
  { id: "citas", label: "Citas", icon: Calendar },
  { id: "taller", label: "Taller", icon: Wrench },
  { id: "perfil", label: "Perfil", icon: User },
];

type ClienteBottomNavProps = {
  activo: ClienteTab;
  onChange: (tab: ClienteTab) => void;
  nombre?: string;
};

function NavButton({
  id,
  label,
  icon: Icon,
  selected,
  onChange,
  layout,
}: {
  id: ClienteTab;
  label: string;
  icon: typeof LayoutDashboard;
  selected: boolean;
  onChange: (tab: ClienteTab) => void;
  layout: "bottom" | "side";
}) {
  const isSide = layout === "side";

  return (
    <button
      type="button"
      onClick={() => onChange(id)}
      className={[
        "transition-colors",
        isSide
          ? [
              "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium",
              selected
                ? "bg-[#ff6b2c]/15 text-[#ff6b2c]"
                : "text-[#9ca3af] hover:bg-white/5 hover:text-white",
            ].join(" ")
          : [
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium sm:text-xs",
              selected ? "text-[#ff6b2c]" : "text-[#6b7280] hover:text-[#9ca3af]",
            ].join(" "),
      ].join(" ")}
    >
      <span
        className={[
          "flex items-center justify-center rounded-xl transition-colors",
          isSide ? "h-9 w-9" : "h-8 w-8 sm:h-9 sm:w-9",
          selected && !isSide ? "bg-[#ff6b2c]/15" : "",
        ].join(" ")}
      >
        <Icon size={isSide ? 20 : 18} strokeWidth={selected ? 2 : 1.5} />
      </span>
      <span className={isSide ? "" : "truncate max-w-full px-0.5"}>{label}</span>
    </button>
  );
}

export default function ClienteBottomNav({ activo, onChange, nombre }: ClienteBottomNavProps) {
  const inicial = nombre?.charAt(0).toUpperCase() ?? "C";

  return (
    <>
      {/* Sidebar — tablet/desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:flex md:w-60 lg:w-64 md:flex-col border-r border-white/10 bg-[#0c1017]">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ff6b2c]/20 text-sm font-bold text-[#ff6b2c]">
            {inicial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Moto Taller</p>
            {nombre && (
              <p className="truncate text-xs text-[#9ca3af]">{nombre.split(" ")[0]}</p>
            )}
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {TABS.map((tab) => (
            <NavButton
              key={tab.id}
              {...tab}
              selected={activo === tab.id}
              onChange={onChange}
              layout="side"
            />
          ))}
        </nav>
      </aside>

      {/* Bottom bar — móvil */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0c1017]/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex w-full max-w-lg items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {TABS.map((tab) => (
            <NavButton
              key={tab.id}
              {...tab}
              selected={activo === tab.id}
              onChange={onChange}
              layout="bottom"
            />
          ))}
        </div>
      </nav>
    </>
  );
}
