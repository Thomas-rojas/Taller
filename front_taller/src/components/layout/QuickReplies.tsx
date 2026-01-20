"use client";
import React, { use, useState } from 'react';
import { Send, X, Headphones, SendHorizontal } from 'lucide-react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#FF5722] p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        <Headphones className="text-white" size={30} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] bg-white rounded-3xl shadow-2xl overflow-hidden font-sans border border-gray-100">
      {/* Header */}
      <div className="bg-[#FF5722] p-5 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full">
            <Headphones className="text-[#FF5722]" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Moto Taller</h3>
            <p className="text-xs opacity-90 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              En línea
            </p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg">
          <X size={24} />
        </button>
      </div>

      {/* Chat Body */}
      <div className="h-[400px] bg-[#F8F9FA] p-4 overflow-y-auto flex flex-col gap-4">
        {/* Welcome Message */}
        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] border border-gray-100">
          <p className="text-gray-800">
            ¡Hola! 👋 Bienvenido a Moto Taller. ¿En qué podemos ayudarte hoy?
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-auto">
          <p className="text-xs text-gray-500 mb-3 px-1">Preguntas frecuentes:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "¿Cuánto cuesta el mantenimiento?",
              "Quiero agendar una cita",
              "¿Cuál es su horario?",
              "¿Dónde están ubicados?"
            ].map((pregunta, index) => (
              <button 
                key={index}
                className="bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-full text-sm hover:bg-gray-50 transition-colors shadow-sm"
              >
                {pregunta}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Footer */}
      <div className="p-4 border-t border-gray-100 bg-white flex items-center gap-2">
        <input 
          type="text" 
          placeholder="Escribe tu mensaje..."
          className="flex-1 bg-[#F1F3F4] py-3 px-5 rounded-full text-sm outline-none focus:ring-1 focus:ring-[#FF5722]/50 transition-all"
        />
        <button className="bg-[#FF5722] p-3 rounded-full text-white hover:bg-[#E64A19] transition-colors">
          <SendHorizontal size={20} />
        </button>
      </div>

      {/* Bottom Floating X Toggle (from image) */}
      <div className="absolute -bottom-20 right-0">
         <button 
          onClick={() => setIsOpen(false)}
          className="bg-[#FF5722] p-4 rounded-full shadow-lg"
        >
          <X className="text-white" size={30} />
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;