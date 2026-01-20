import React from "react";
import Image from "next/image";

const Hero=()=>{
    return (
    <section className="relative h-screen w-full flex items-center justify-start overflow-hidden">
      {/* Imagen de Fondo con Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/fondo.png')", // Coloca tu imagen en /public
        }}
      >
        {/* Capa oscura para dar contraste al texto */}
        <div className="absolute inset-0 bg-black/40 lg:bg-black/20" />
      </div>

      {/* Contenedor del Texto */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 w-full">
        <div className="max-w-2xl">
          
          {/* Badge Superior */}
          <div className="inline-block bg-orange-600/90 text-white text-xs md:text-sm font-bold px-4 py-1.5 rounded-full mb-6">
            Taller de Barrio / Desde 2010
          </div>

          {/* Título Principal */}
          <h1 className="text-white text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] mb-6 drop-shadow-lg">
            Tu moto, como <br /> si fuera <br /> nuestra
          </h1>

          {/* Subtítulo */}
          <p className="text-white text-lg md:text-xl font-medium mb-10 max-w-lg leading-relaxed drop-shadow-md">
            Somos un taller pequeño, pero trabajamos con el corazón 
            y tratamos a nuestros clientes como familia.
          </p>

          {/* Botón WhatsApp */}
          <a 
            href="https://wa.me/tu-numero" 
            target="_blank" 
            className="inline-flex items-center gap-3 bg-[#ff7341] hover:bg-[#e65d2f] text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-xl"
          >
            {/* Icono de WhatsApp (SVG simplificado) */}
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.675 1.438 5.662 1.439h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Agenda tu cita por WhatsApp 
            <span className="text-xl ml-1">→</span>
          </a>
        </div>
      </div>

      {/* Indicador de Scroll (Flecha abajo) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <svg 
          className="w-8 h-8 text-white/70" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
export default Hero;