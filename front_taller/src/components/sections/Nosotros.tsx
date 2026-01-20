import React from "react";
import Image from "next/image";

const Nosotros = () => {
  return (
    <section className="bg-[#0a0a0a] text-white py-16 px-4 md:px-12 lg:px-20 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        
        {/* LADO IZQUIERDO: CONTENEDOR DE IMÁGENES */}
        <div className="flex flex-col gap-4">
          <div className="relative h-[400px] w-full rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/mecanico.png" 
              alt="Mecánico trabajando"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative h-[250px] w-full rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/moto.png" 
              alt="Interior del taller"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* LADO DERECHO: TARJETA DE INFORMACIÓN */}
        <div className="bg-[#1a1a1a] p-8 md:p-14 rounded-[2.5rem] shadow-2xl border border-zinc-800/50">
          <span className="text-orange-600 font-bold uppercase tracking-widest text-xs">
            Nuestra Historia
          </span>
          
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Quiénes Somos
          </h2>
          
          <p className="text-zinc-400 text-lg mb-8">
            Somos un taller de barrio con años de experiencia, donde cada moto que 
            llega es revisada con cuidado, respeto y responsabilidad.
          </p>

          {/* CUADRO DE CITA */}
          <div className="border-l-4 border-orange-500 bg-[#252525] p-6 mb-10 rounded-r-xl">
            <p className="italic text-zinc-200 text-lg">
              "Aquí no eres un número. Cada moto es tratada como si fuera nuestra propia moto."
            </p>
          </div>

          {/* SECCIÓN DE VALORES MANUAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Valor 1 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </div>
              <div>
                <h4 className="font-bold text-base">Trato Familiar</h4>
                <p className="text-zinc-500 text-xs">Atención personalizada y cercana</p>
              </div>
            </div>

            {/* Valor 2 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
              </div>
              <div>
                <h4 className="font-bold text-base">Honestidad</h4>
                <p className="text-zinc-500 text-xs">Transparencia en cada trabajo</p>
              </div>
            </div>

            {/* Valor 3 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <div>
                <h4 className="font-bold text-base">Experiencia</h4>
                <p className="text-zinc-500 text-xs">Años trabajando con pasión</p>
              </div>
            </div>

            {/* Valor 4 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div>
                <h4 className="font-bold text-base">Calidad</h4>
                <p className="text-zinc-500 text-xs">Trabajo garantizado</p>
              </div>
            </div>
            {/*Vision de nuestro taller*/}
            
          </div>
        </div>

      </div>
    </section>
  );
};

export default Nosotros;