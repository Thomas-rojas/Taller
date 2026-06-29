import Link from "next/link";
import { WHATSAPP_URL } from "@/src/lib/contact";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-28 md:pt-32 lg:pt-36 overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/fondo.png')" }}
        aria-hidden
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" aria-hidden />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28 w-full">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-white mb-6 drop-shadow-md">
            Taller premium
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.1] mb-6 drop-shadow-lg [text-shadow:_0_2px_24px_rgb(0_0_0_/_0.6)]">
            Tu moto merece
            <span className="block">cuidado excepcional</span>
          </h1>
          <p className="text-white text-lg leading-relaxed max-w-lg mb-10 drop-shadow-md [text-shadow:_0_1px_12px_rgb(0_0_0_/_0.5)]">
            Mantenimiento y reparación con estándares premium. Trato familiar, procesos
            transparentes y resultados que hablan por sí solos.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-[#e8774a] hover:bg-[#d4693e] text-white text-sm font-medium px-8 py-3.5 transition-colors"
            >
              Agendar cita
            </a>
            <Link
              href="#servicios"
              className="inline-flex items-center border-2 border-white text-white bg-white/10 hover:bg-white hover:text-[#111111] text-sm font-medium px-8 py-3.5 transition-colors drop-shadow-md"
            >
              Ver servicios
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
