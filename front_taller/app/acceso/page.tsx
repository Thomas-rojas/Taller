"use client";

import Link from "next/link";
import { ArrowLeft, User, Wrench } from "lucide-react";

export default function AccesoPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#111111]">
      <header className="border-b border-[#e8e8e8] bg-white">
        <div className="max-w-lg mx-auto px-6 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-[#111111] transition-colors"
          >
            <ArrowLeft size={16} />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-12 md:py-16">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-2">Entrar</h1>
          <p className="text-sm text-[#737373]">Elige cómo quieres ingresar</p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/cliente"
            className="group flex items-center gap-4 bg-white border border-[#e8e8e8] hover:border-[#111111] p-5 transition-colors"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e8e8e8] group-hover:border-[#111111] transition-colors">
              <User size={22} strokeWidth={1.25} />
            </span>
            <span className="text-left">
              <span className="block text-sm font-medium">Soy cliente</span>
              <span className="block text-xs text-[#737373] mt-0.5">
                Regístrate o revisa el estado de tus citas
              </span>
            </span>
          </Link>

          <Link
            href="/mecanico"
            className="group flex items-center gap-4 bg-white border border-[#e8e8e8] hover:border-[#111111] p-5 transition-colors"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e8e8e8] group-hover:border-[#111111] transition-colors">
              <Wrench size={22} strokeWidth={1.25} />
            </span>
            <span className="text-left">
              <span className="block text-sm font-medium">Soy mecánico</span>
              <span className="block text-xs text-[#737373] mt-0.5">
                Acceso al panel del taller
              </span>
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
