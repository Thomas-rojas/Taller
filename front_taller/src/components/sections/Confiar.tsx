import React from 'react';

const PorQueConfiar: React.FC = () => {
  const puntosClave = [
    "Trato familiar y personalizado",
    "Explicamos el trabajo antes de hacerlo",
    "Precios justos y transparentes",
    "Trabajo garantizado",
    "Honestidad ante todo",
    "Respeto por tu moto y tu tiempo"
  ];

  return (
    <section className="bg-black py-16 px-4 flex justify-center">
      {/* Contenedor Principal con Bordes Redondeados */}
      <div className="bg-[#111111] max-w-5xl w-full rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Lado Izquierdo: Imagen */}
        <div className="md:w-2/5 h-80 md:h-auto relative">
          <img 
            src="/3.png" 
            alt="Mecánicos trabajando" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Lado Derecho: Contenido */}
        <div className="md:w-3/5 p-8 md:p-16 relative flex flex-col justify-center">
          
          {/* Comilla Decorativa */}
          <span className="absolute top-10 left-10 text-[#8b6e3d] text-6xl font-serif opacity-50">
            "
          </span>

          <h2 className="text-white text-4xl md:text-5xl font-bold leading-tight mb-8 relative z-10">
            Por Qué Confiar en Nosotros
          </h2>

          {/* Lista de Puntos */}
          <ul className="space-y-4 mb-10">
            {puntosClave.map((punto, index) => (
              <li key={index} className="flex items-center gap-4 text-white text-lg">
                <div className="bg-[#f06529] rounded-full p-1 flex-shrink-0">
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="4" 
                    className="w-3 h-3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="font-medium">{punto}</span>
              </li>
            ))}
          </ul>

          {/* Botón con Degradado */}
          <button className="bg-gradient-to-r from-[#f06529] to-[#f8b244] text-white font-bold py-4 px-8 rounded-full flex items-center justify-center gap-2 w-fit hover:scale-105 transition-transform">
            Ver Trabajos Realizados
            <span className="text-xl">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default PorQueConfiar;