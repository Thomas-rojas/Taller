'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WHATSAPP_URL } from '@/src/lib/contact';

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    // CAMBIO: 'class' por 'className'
    <nav className="fixed w-full z-50 bg-black/70 backdrop-blur-md border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link href="#inicio" className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500 bg-orange-500 flex items-center justify-center font-bold">
              <Image src="/LOGO.png" alt='imagen empresa' width='50' height='40'/>
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tight">
              Moto Taller Familiar
            </span>
          </Link>

          {/* Enlaces Desktop */}
          <div className="hidden md:block">
            <ul className="flex space-x-8 text-sm lg:text-base font-medium">
              <li><Link href="#inicio" className="hover:text-orange-500 transition-colors">Inicio</Link></li>
              <li><Link href="#nosotros" className="hover:text-orange-500 transition-colors">Nosotros</Link></li>
              <li><Link href="#servicios" className="hover:text-orange-500 transition-colors">Servicios</Link></li>
              <li><Link href="#galeria" className="hover:text-orange-500 transition-colors">Galería</Link></li>
              <li><Link href="#contacto" className="hover:text-orange-500 transition-colors">Contacto</Link></li>
              <li>
                <Link
                  href="/mecanico"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Mecánico
                </Link>
              </li>
            </ul>
          </div>

          {/* Botón CTA */}
          <div className="hidden sm:block">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-6 py-2 rounded-full font-bold transition-all duration-300"
            >
              Contáctanos
            </a>
          </div>

          {/* Botón Menú Móvil */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-white hover:text-orange-500 focus:outline-none"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil condicional */}
      {isOpen && (
        <div className="md:hidden bg-black/95 border-b border-white/10">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link href="#inicio" className="block px-3 py-2 hover:text-orange-500">Inicio</Link>
            <Link href="#nosotros" className="block px-3 py-2 hover:text-orange-500">Nosotros</Link>
            <Link href="#servicios" className="block px-3 py-2 hover:text-orange-500">Servicios</Link>
            <Link href="#galeria" className="block px-3 py-2 hover:text-orange-500">Galería</Link>
            <Link href="#contacto" className="block px-3 py-2 hover:text-orange-500">Contacto</Link>
            <Link href="/mecanico" className="block px-3 py-2 text-gray-400 hover:text-orange-500">
              Panel mecánico
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Nav;