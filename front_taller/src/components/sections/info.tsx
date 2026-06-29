"use client";

import React from "react";
import Link from "next/link";
import { WHATSAPP_URL } from "@/src/lib/contact";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#111111] text-white py-16 px-6 md:px-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <h2 className="text-sm font-medium tracking-tight mb-4">Moto Taller Familiar</h2>
          <p className="text-[#737373] text-sm leading-relaxed max-w-xs">
            Experiencia premium en el cuidado de tu moto. Trato familiar, resultados excepcionales.
          </p>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-[#737373] mb-6">Navegación</h3>
          <ul className="space-y-3 text-sm text-[#a3a3a3]">
            <li><Link href="#inicio" className="hover:text-white transition-colors">Inicio</Link></li>
            <li><Link href="#servicios" className="hover:text-white transition-colors">Servicios</Link></li>
            <li><Link href="#testimonios" className="hover:text-white transition-colors">Testimonios</Link></li>
            <li><Link href="#galeria" className="hover:text-white transition-colors">Galería</Link></li>
            <li><Link href="#contacto" className="hover:text-white transition-colors">Contacto</Link></li>
            <li><Link href="/acceso" className="hover:text-white transition-colors">Regístrate o inicia sesión</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-[#737373] mb-6">Contacto</h3>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-[#e8774a] hover:bg-[#d4693e] text-white text-sm font-medium px-6 py-3 transition-colors"
          >
            Escríbenos por WhatsApp
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-[#333333]">
        <p className="text-xs text-[#737373]">
          © {new Date().getFullYear()} Moto Taller Familiar. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
