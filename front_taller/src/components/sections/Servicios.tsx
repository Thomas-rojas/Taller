import React from 'react';

const SeccionServicios: React.FC = () => {
  // Datos estructurados para mapear el diseño
  const servicios = [
    { titulo: "Mantenimiento General", desc: "Revisión completa de tu moto", icon: "⚙️" },
    { titulo: "Cambio de Aceite", desc: "Aceite y filtros de calidad", icon: "💧" },
    { titulo: "Frenos", desc: "Seguridad en cada frenada", icon: "🔘" },
    { titulo: "Llantas", desc: "Cambio y balanceo", icon: "🎡" },
    { titulo: "Sistema Eléctrico", desc: "Diagnóstico y reparación", icon: "⚡" },
    { titulo: "Baterías", desc: "Cambio y mantenimiento", icon: "🔋" },
    { titulo: "Ajustes de Motor", desc: "Optimización del rendimiento", icon: "🛠️" },
    { titulo: "Diagnóstico Básico", desc: "Identificación de fallas", icon: "🔍" },
    { titulo: "Revisión Pre-viaje", desc: "Viaja con tranquilidad", icon: "🏍️" },
    { titulo: "Servicio Rápido", desc: "Según disponibilidad", icon: "🕒" },
  ];

  return (
    <section className="bg-[#0a0a0a] min-h-screen text-white p-6 md:p-12 lg:p-20 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Nuestros Servicios
          </h2>
          <div className="h-[3px] w-12 bg-[#e65100] mb-8"></div>
          <p className="text-[#a0a0a0] text-lg md:text-xl font-medium">
            Todo lo que tu moto necesita, con honestidad y experiencia
          </p>
        </div>

        {/* Grid: 4 columnas en desktop, 2 en tablet, 1 en móvil */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {servicios.map((item, index) => (
            <div 
              key={index} 
              className="bg-[#1a1a1a] p-8 rounded-2xl border border-transparent hover:border-[#333] transition-all duration-300 flex flex-col items-start group cursor-pointer"
            >
              {/* Contenedor del Icono */}
              <div className="bg-[#2a1a14] w-14 h-14 rounded-xl flex items-center justify-center mb-8 group-hover:bg-[#3d251a] transition-colors">
                {/* Aquí puedes poner un SVG. Uso un span para el ejemplo visual */}
                <span className="text-[#ff5722] text-2xl filter drop-shadow-md">
                  {/* Reemplaza este span por el icono SVG que prefieras */}
                  {item.icon}
                </span>
              </div>

              {/* Texto */}
              <h3 className="text-xl font-bold mb-3 tracking-wide group-hover:text-[#ff5722] transition-colors">
                {item.titulo}
              </h3>
              <p className="text-[#808080] text-[15px] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer WhatsApp */}
        <div className="mt-24 text-center">
          <p className="text-[#a0a0a0] text-lg mb-4">¿No encuentras lo que buscas?</p>
          <a 
            href="#" 
            className="inline-flex items-center text-[#ff5722] font-bold text-lg hover:underline decoration-2 underline-offset-8 transition-all"
          >
            Pregúntanos por WhatsApp 
            <span className="ml-2 text-xl">→</span>
          </a>
        </div>

      </div>
    </section>
  );
  
};

export default SeccionServicios;