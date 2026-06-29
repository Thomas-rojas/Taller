"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";

const links = [
  { id: "inicio", href: "#inicio", label: "Inicio" },
  { id: "servicios", href: "#servicios", label: "Servicios" },
  { id: "testimonios", href: "#testimonios", label: "Testimonios" },
  { id: "galeria", href: "#galeria", label: "Galería" },
  { id: "contacto", href: "#contacto", label: "Contacto" },
] as const;

type SectionId = (typeof links)[number]["id"];

const sectionIds = links.map((l) => l.id);

const navThemes: Record<
  SectionId,
  {
    nav: string;
    linkInactive: string;
    linkActive: string;
    secondary: string;
    logoFilter: string;
    mobilePanel: string;
    mobileBorder: string;
  }
> = {
  inicio: {
    nav: "bg-[#0c0c0c]/95 border-white/5 text-white",
    linkInactive: "text-white/75 hover:text-white",
    linkActive: "text-[#e8774a] border-[#e8774a]",
    secondary: "text-white/60 hover:text-white",
    logoFilter: "brightness-0 invert",
    mobilePanel: "bg-[#0c0c0c]",
    mobileBorder: "border-white/10",
  },
  servicios: {
    nav: "bg-white/95 border-[#e8e8e8] text-[#111111]",
    linkInactive: "text-[#737373] hover:text-[#111111]",
    linkActive: "text-[#e8774a] border-[#e8774a]",
    secondary: "text-[#737373] hover:text-[#111111]",
    logoFilter: "brightness-0 opacity-90",
    mobilePanel: "bg-white",
    mobileBorder: "border-[#e8e8e8]",
  },
  testimonios: {
    nav: "bg-[#f0f0f0]/95 border-[#e0e0e0] text-[#111111]",
    linkInactive: "text-[#737373] hover:text-[#111111]",
    linkActive: "text-[#c45a2e] border-[#c45a2e]",
    secondary: "text-[#737373] hover:text-[#111111]",
    logoFilter: "brightness-0 opacity-90",
    mobilePanel: "bg-[#f0f0f0]",
    mobileBorder: "border-[#e0e0e0]",
  },
  galeria: {
    nav: "bg-[#111111]/95 border-[#222222] text-white",
    linkInactive: "text-white/70 hover:text-white",
    linkActive: "text-[#e8774a] border-[#e8774a]",
    secondary: "text-white/60 hover:text-white",
    logoFilter: "brightness-0 invert",
    mobilePanel: "bg-[#111111]",
    mobileBorder: "border-white/10",
  },
  contacto: {
    nav: "bg-[#e8774a]/95 border-[#d4693e] text-white",
    linkInactive: "text-white/80 hover:text-white",
    linkActive: "text-white border-white font-semibold",
    secondary: "text-white/80 hover:text-white",
    logoFilter: "brightness-0 invert",
    mobilePanel: "bg-[#d4693e]",
    mobileBorder: "border-white/20",
  },
};

function AccesoButton({
  compact = false,
  fullWidth = false,
  onClick,
  inverted = false,
}: {
  compact?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  inverted?: boolean;
}) {
  return (
    <Link
      href="/acceso"
      onClick={onClick}
      className={[
        "group inline-flex items-center justify-center gap-2 transition-all duration-300 shrink-0",
        inverted
          ? "border-2 border-white/90 text-white hover:bg-white hover:text-[#111111]"
          : "border-2 border-[#e8774a] text-[#e8774a] hover:bg-[#e8774a] hover:text-white",
        fullWidth ? "w-full py-3.5 text-xs tracking-[0.18em] uppercase font-semibold" : "",
        compact
          ? "h-10 w-10 rounded-full p-0"
          : "rounded-full px-4 py-2.5 text-[10px] sm:text-[11px] uppercase tracking-[0.16em] font-semibold",
      ].join(" ")}
      aria-label="Regístrate o inicia sesión"
    >
      <User
        size={compact ? 18 : 15}
        strokeWidth={1.75}
        className="transition-transform duration-300 group-hover:scale-110"
      />
      {!compact && (
        <span className="hidden sm:inline whitespace-nowrap">Regístrate · Inicia sesión</span>
      )}
    </Link>
  );
}

function AgendarCitaButton({
  fullWidth = false,
  compact = false,
  onClick,
}: {
  fullWidth?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href="#contacto"
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center bg-[#e8774a] hover:bg-[#d4693e] text-white font-semibold uppercase transition-colors shrink-0",
        fullWidth ? "w-full py-3 text-xs tracking-widest" : "",
        compact ? "text-[10px] tracking-[0.14em] px-3 py-2 rounded-lg" : "text-[11px] tracking-[0.18em] px-4 py-2.5 rounded-lg",
      ].join(" ")}
    >
      {compact ? "Cita" : "Agendar cita"}
    </Link>
  );
}

function NavLink({
  href,
  label,
  active,
  theme,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  theme: (typeof navThemes)[SectionId];
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "uppercase text-[11px] md:text-xs tracking-[0.18em] pb-1.5 border-b-2 transition-colors duration-300",
        active ? `${theme.linkActive} font-semibold` : `${theme.linkInactive} border-transparent`,
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activo, setActivo] = useState<SectionId>("inicio");
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const theme = navThemes[activo];
  const navOscura = activo === "inicio" || activo === "galeria" || activo === "contacto";

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      if (y <= 64) {
        setNavVisible(true);
      } else if (y > lastScrollY.current + 8) {
        setNavVisible(false);
        setIsOpen(false);
      } else if (y < lastScrollY.current - 8) {
        setNavVisible(true);
      }

      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const elementos = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elementos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id && visible.target.id in navThemes) {
          setActivo(visible.target.id as SectionId);
        }
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.2, 0.5] },
    );

    elementos.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className={[
        "fixed w-full z-50 backdrop-blur-sm border-b transition-all duration-500 ease-in-out",
        navVisible ? "translate-y-0" : "-translate-y-full",
        theme.nav,
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <div className="flex items-center justify-between h-28 md:h-32 lg:h-36 gap-3">
          <Link href="#inicio" className="shrink-0 group" aria-label="Moto Taller - Inicio">
            <Image
              src="/logo-moto-clean.png"
              alt="Moto Taller"
              width={144}
              height={144}
              priority
              className={[
                "h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-36 lg:w-36 object-contain transition-opacity duration-300 group-hover:opacity-70",
                theme.logoFilter,
              ].join(" ")}
            />
          </Link>

          <ul className="hidden lg:flex items-center justify-center flex-1 gap-6 xl:gap-10">
            {links.map((link) => (
              <li key={link.id}>
                <NavLink
                  href={link.href}
                  label={link.label}
                  active={activo === link.id}
                  theme={theme}
                />
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 shrink-0">
            <span className="lg:hidden">
              <AgendarCitaButton compact />
            </span>
            <span className="hidden lg:inline-flex">
              <AgendarCitaButton />
            </span>

            <span className="lg:hidden">
              <AccesoButton compact inverted={navOscura} />
            </span>
            <span className="hidden lg:inline-flex">
              <AccesoButton inverted={navOscura} />
            </span>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 transition-colors duration-300"
              aria-label="Menú"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className={`lg:hidden border-t transition-colors duration-500 ${theme.mobileBorder} ${theme.mobilePanel}`}>
          <div className="px-5 py-5 flex flex-col gap-4">
            {links.map((link) => (
              <NavLink
                key={link.id}
                href={link.href}
                label={link.label}
                active={activo === link.id}
                theme={theme}
                onClick={() => setIsOpen(false)}
              />
            ))}
            <div className="pt-2 flex flex-col gap-3">
              <AccesoButton fullWidth inverted={navOscura} onClick={() => setIsOpen(false)} />
              <AgendarCitaButton fullWidth onClick={() => setIsOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Nav;
