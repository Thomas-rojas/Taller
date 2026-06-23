'use client'; // Mantenlo por si usas efectos o eventos de clic

import React from 'react';
import { Instagram, Facebook, Youtube, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { WHATSAPP_URL } from '@/src/lib/contact';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-12 px-6 md:px-16 border-t border-gray-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* 1. BRANDING / LOGO */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {/* Logo circular blanco */}
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-black rounded-sm" /> {/* Reemplazar por tu SVG de logo */}
            </div>
            <h2 className="text-xl font-bold tracking-tight">Moto Taller</h2>
          </div>
          <p className="text-gray-400 italic text-sm leading-relaxed max-w-[200px]">
            "Un pequeño más alto, pero con corazón grande."
          </p>
        </div>

        {/* 2. NAVEGACIÓN */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Navegación</h3>
          <ul className="space-y-4 text-gray-400 text-sm">
            <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
            <li><Link href="/nosotros" className="hover:text-white transition-colors">Nosotros</Link></li>
            <li><Link href="/servicios" className="hover:text-white transition-colors">Servicios</Link></li>
            <li><Link href="/galeria" className="hover:text-white transition-colors">Galería</Link></li>
            <li><Link href="#contacto" className="hover:text-white transition-colors">Contacto</Link></li>
          </ul>
        </div>

        {/* 3. SÍGUENOS */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Síguenos</h3>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer group">
              <div className="p-2 border border-gray-800 rounded-full group-hover:border-gray-600 transition-colors">
                <Instagram size={18} />
              </div>
              <span className="text-sm">Instagram</span>
            </li>
            <li className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer group">
              <div className="p-2 border border-gray-800 rounded-full group-hover:border-gray-600 transition-colors">
                <Facebook size={18} />
              </div>
              <span className="text-sm">Facebook</span>
            </li>
            <li className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer group">
              <div className="p-2 border border-gray-800 rounded-full group-hover:border-gray-600 transition-colors">
                <Youtube size={18} />
              </div>
              <span className="text-sm">YouTube</span>
            </li>
          </ul>
        </div>

        {/* 4. CONTACTO RÁPIDO */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Contacto Rápido</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            ¿Tienes alguna pregunta? Escríbenos y te responderemos pronto.
          </p>
          <a 
            href={WHATSAPP_URL}
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#ff6b35] hover:bg-[#e85a20] text-white font-bold py-3 px-6 rounded-full transition-all shadow-lg"
          >
            <MessageCircle size={20} />
            <span>WhatsApp</span>
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;