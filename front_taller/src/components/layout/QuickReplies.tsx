"use client";

import React, { useEffect, useState } from "react";
import { SendHorizontal, X, Headphones } from "lucide-react";
import { api } from "@/src/lib/api";

type ChatMessage = {
  id: string;
  text: string;
  from: "user" | "bot";
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [faqs, setFaqs] = useState<string[]>([
    "¿Qué servicios ofrecen?",
    "¿Cuánto cuesta el mantenimiento?",
    "Quiero agendar una cita",
    "¿Cuál es su horario?",
    "¿Dónde están ubicados?",
    "¿Tienen garantía en los trabajos?",
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      text: "¡Hola! 👋 Bienvenido a Moto Taller. Puedo ayudarte con información sobre nuestros servicios, horarios, ubicación y citas.",
      from: "bot",
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getFaqs()
      .then((data) => setFaqs(data.map((f) => f.pregunta)))
      .catch(() => {});
  }, []);

  const enviarMensaje = async (texto: string) => {
    if (!texto.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: texto.trim(),
      from: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setMensaje("");
    setLoading(true);

    try {
      const { respuesta } = await api.enviarMensaje(texto.trim());
      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, text: respuesta, from: "bot" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-error-${Date.now()}`,
          text: "No pudimos enviar tu mensaje en este momento. Si necesitas ayuda, comunícate con un asesor a través del botón Contáctanos en la parte superior de la página.",
          from: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="fixed bottom-6 right-6 w-[380px] bg-white rounded-3xl shadow-2xl overflow-hidden font-sans border border-gray-100 z-50">
      <div className="bg-[#FF5722] p-5 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full">
            <Headphones className="text-[#FF5722]" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Moto Taller</h3>
            <p className="text-xs opacity-90 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              En línea
            </p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg">
          <X size={24} />
        </button>
      </div>

      <div className="h-[400px] bg-[#F8F9FA] p-4 overflow-y-auto flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded-2xl shadow-sm max-w-[85%] border ${
              msg.from === "user"
                ? "bg-[#FF5722] text-white ml-auto rounded-tr-none border-[#FF5722]"
                : "bg-white text-gray-800 rounded-tl-none border-gray-100"
            }`}
          >
            <p className="whitespace-pre-line">{msg.text}</p>
          </div>
        ))}

        {loading && (
          <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[60%] border border-gray-100 text-gray-500 text-sm">
            Escribiendo...
          </div>
        )}

        <div className="mt-auto">
          <p className="text-xs text-gray-500 mb-3 px-1">Preguntas frecuentes:</p>
          <div className="flex flex-wrap gap-2">
            {faqs.map((pregunta) => (
              <button
                key={pregunta}
                onClick={() => enviarMensaje(pregunta)}
                className="bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-full text-sm hover:bg-gray-50 transition-colors shadow-sm"
              >
                {pregunta}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-white flex items-center gap-2">
        <input
          type="text"
          placeholder="Escribe tu mensaje..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviarMensaje(mensaje)}
          className="flex-1 bg-[#F1F3F4] py-3 px-5 rounded-full text-sm outline-none focus:ring-1 focus:ring-[#FF5722]/50 transition-all"
        />
        <button
          onClick={() => enviarMensaje(mensaje)}
          disabled={loading}
          className="bg-[#FF5722] p-3 rounded-full text-white hover:bg-[#E64A19] transition-colors disabled:opacity-60"
        >
          <SendHorizontal size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
