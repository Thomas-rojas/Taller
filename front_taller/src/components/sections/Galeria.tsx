import Image from 'next/image';

const Galeria = () => {
  const images = [
    {
      id: 1,
      src: '/4.png', // Cambia por tus rutas reales
      alt: 'Mecánico trabajando',
      title: 'Trabajo en proceso',
      desc: 'Reparacion de Motor',
      size: 'large',
    },
    {
      id: 2,
      src: '/6.png',
      alt: 'Moto frontal',
      title: 'Resultado Final',
      desc: 'Moto despues del servicio',
      size: 'small',
    },
    {
      id: 3,
      src: '/5.png',
      alt: 'Herramientas',
      title: 'Nuestro taller',
      desc: 'Herramientas profesionales',
      size: 'small',
    },
    {
      id: 4,
      src: '/8.png',
      alt: 'Moto en taller',
      title: 'Trabajo en Proceso',
      desc: 'Servicio de frenos',
      size: 'small',
    },
    {
        id: 5,
        src: '/7.png',
        alt: 'Mecánico ajustando moto',
        title: 'Clientes Felices',
        desc: 'Clientes Satisfechos',
        size: 'small',
    },
  ];

  return (
    <section className="bg-[#121212] py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-10">
          <h2 className="text-white text-5xl font-bold mb-2">Galeria</h2>
          <div className="w-16 h-1 bg-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-400 italic">Nuestro trabajo habla por sí solo</p>
        </div>

        {/* Grid de Imágenes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px]">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative group overflow-hidden rounded-xl cursor-pointer ${
                img.size === 'large' ? 'md:col-span-2 md:row-span-2' : 'md:col-span-1'
              }`}
            >
              {/* Imagen */}
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay de Texto (Aparece en Hover) */}
              <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-orange-500 text-sm font-bold uppercase mb-1">
                  {img.title}
                </span>
                <h3 className="text-white text-xl font-bold leading-tight">
                  {img.desc}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Galeria;