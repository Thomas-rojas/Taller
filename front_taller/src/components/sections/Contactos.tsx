import React from 'react';
import { MessageCircle, Phone, MapPin, Clock } from 'lucide-react';

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Agenda Tu Cita Hoy</h1>
        <p className="text-gray-400 text-lg mb-4">Escríbenos, aquí te atendemos con gusto</p>
        <div className="flex items-center justify-center text-orange-400 gap-2">
          <Clock size={20} />
          <span className="font-medium">Respuesta en menos de 2 horas</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Contact Card */}
        <div className="bg-[#1a1a1a] p-8 rounded-3xl flex flex-col gap-6">
          <h2 className="text-2xl font-bold mb-2">Contáctanos</h2>

          {/* WhatsApp Item (Highlighted) */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-green-500/50 bg-green-500/5">
            <div className="bg-green-500 p-3 rounded-full">
              <MessageCircle size={24} className="text-white fill-current" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">WhatsApp</p>
              <p className="text-xl font-semibold">+57 314 490 2016</p>
            </div>
          </div>

          {/* Phone Item */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#262626]">
            <div className="bg-orange-500 p-3 rounded-full">
              <Phone size={24} className="text-white fill-current" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Teléfono</p>
              <p className="text-xl font-semibold">+57 322 680 7105</p>
            </div>
          </div>

          {/* Address Item */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#262626]">
            <div className="bg-orange-500 p-3 rounded-full">
              <MapPin size={24} className="text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Dirección</p>
              <p className="text-lg font-semibold">Calle 92sur #4a-29, Barrio el virrey</p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="relative h-[400px] lg:h-auto min-h-[450px] rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-gray-800">
          <iframe
            title="Ubicación"
            src="https://www.google.com/maps/embed?pb=!4v1768600543893!6m8!1m7!1sW06QOzluRnuyTKNjBiKdxA!2m2!1d4.500475058566445!2d-74.10978571204576!3f260.690791112366!4f-12.694446639126284!5f0.7820865974627469"
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            loading="lazy"
          ></iframe>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;