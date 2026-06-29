"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SendHorizontal, X } from "lucide-react";
import { api } from "@/src/lib/api";
import { WHATSAPP_URL } from "@/src/lib/contact";

type ChatMessage = {
  id: string;
  text: string;
  from: "user" | "bot";
};

type SectionId = "inicio" | "servicios" | "testimonios" | "galeria" | "contacto";

const SECTION_IDS: SectionId[] = ["inicio", "servicios", "testimonios", "galeria", "contacto"];

const MENSAJES_SECCION: Record<SectionId, string> = {
  inicio: "¿Buscas mantenimiento para tu moto? ¡Pregúntame lo que necesites!",
  servicios: "¿Quieres saber más sobre algún servicio? Estoy aquí para ayudarte.",
  testimonios: "¿Tienes dudas sobre nuestro taller? Con gusto te oriento.",
  galeria: "¿Te gustó nuestro trabajo? Puedo ayudarte a agendar una cita.",
  contacto: "¿Necesitas ayuda para agendar? Escríbeme y te guío paso a paso.",
};

const SALUDOS_APERTURA: Record<SectionId, string> = {
  inicio:
    "¡Hola! 👋 Soy el asistente virtual de Moto Taller. Puedo contarte sobre servicios, precios, horarios y citas.",
  servicios:
    "¡Hola! Veo que estás revisando nuestros servicios. ¿Te gustaría saber precios, tiempos o agendar alguno?",
  testimonios:
    "¡Hola! ¿Quieres la misma experiencia que nuestros clientes? Pregúntame cómo agendar tu cita.",
  galeria:
    "¡Hola! ¿Te interesa un servicio como los de la galería? Cuéntame qué necesita tu moto.",
  contacto:
    "¡Hola! Estás en contacto. Si tienes dudas antes de enviar el formulario, escríbeme aquí.",
};

const STORAGE_BURBUJA = "moto-taller-chat-burbuja-cerrada";

function TypingIndicator() {
  return (
    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-[#e8e8e8] max-w-[60%] flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-[#e8774a] typing-dot" />
      <span className="w-2 h-2 rounded-full bg-[#e8774a] typing-dot" />
      <span className="w-2 h-2 rounded-full bg-[#e8774a] typing-dot" />
    </div>
  );
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [seccionActiva, setSeccionActiva] = useState<SectionId>("inicio");
  const [mostrarBurbuja, setMostrarBurbuja] = useState(false);
  const [burbujaVisible, setBurbujaVisible] = useState(false);
  const [faqs, setFaqs] = useState<string[]>([
    "¿Qué servicios ofrecen?",
    "¿Cuánto cuesta el mantenimiento?",
    "Quiero agendar una cita",
    "¿Cuál es su horario?",
    "¿Dónde están ubicados?",
    "¿Tienen garantía en los trabajos?",
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [saludoEnviado, setSaludoEnviado] = useState(false);
  const mensajesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .getFaqs()
      .then((data) => setFaqs(data.map((f) => f.pregunta)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const elementos = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (elementos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id && SECTION_IDS.includes(visible.target.id as SectionId)) {
          setSeccionActiva(visible.target.id as SectionId);
        }
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.2, 0.5] },
    );

    elementos.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isOpen) return;
    const cerrada = sessionStorage.getItem(STORAGE_BURBUJA);
    if (cerrada) return;

    const timer = setTimeout(() => {
      setMostrarBurbuja(true);
      requestAnimationFrame(() => setBurbujaVisible(true));
    }, 4000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || saludoEnviado) return;
    setMessages([
      {
        id: "welcome",
        text: SALUDOS_APERTURA[seccionActiva],
        from: "bot",
      },
    ]);
    setSaludoEnviado(true);
  }, [isOpen, saludoEnviado, seccionActiva]);

  useEffect(() => {
    const el = mensajesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const cerrarBurbuja = useCallback(() => {
    setBurbujaVisible(false);
    setTimeout(() => setMostrarBurbuja(false), 300);
    sessionStorage.setItem(STORAGE_BURBUJA, "1");
  }, []);

  const abrirChat = useCallback(() => {
    cerrarBurbuja();
    setIsOpen(true);
  }, [cerrarBurbuja]);

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

    const delay = Math.min(1800, 600 + texto.trim().length * 30);

    try {
      const { respuesta } = await api.enviarMensaje(texto.trim());
      await new Promise((r) => setTimeout(r, delay));
      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, text: respuesta, from: "bot" },
      ]);
    } catch {
      await new Promise((r) => setTimeout(r, 800));
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-error-${Date.now()}`,
          text: "No pude conectar en este momento. Puedes escribirnos por WhatsApp o usar el formulario de contacto. ¡Estamos para ayudarte!",
          from: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {mostrarBurbuja && (
          <div
            className={[
              "relative max-w-[260px] sm:max-w-[280px] transition-all duration-300",
              burbujaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
            ].join(" ")}
          >
            <div className="animate-bubble-in bg-white border border-[#e8e8e8] rounded-2xl shadow-lg p-4 pr-10">
              <p className="text-sm text-[#111111] leading-relaxed mb-3">
                {MENSAJES_SECCION[seccionActiva]}
              </p>
              <button
                type="button"
                onClick={abrirChat}
                className="text-xs font-semibold text-[#e8774a] hover:text-[#d4693e] uppercase tracking-wide"
              >
                Iniciar conversación →
              </button>
            </div>
            <button
              type="button"
              onClick={cerrarBurbuja}
              className="absolute top-2 right-2 p-1 text-[#a3a3a3] hover:text-[#111111]"
              aria-label="Cerrar mensaje"
            >
              <X size={16} />
            </button>
            <div className="absolute -bottom-2 right-10 w-4 h-4 bg-white border-r border-b border-[#e8e8e8] rotate-45" />
          </div>
        )}

        <button
          onClick={abrirChat}
          className="relative w-32 h-32 md:w-40 md:h-40 bg-transparent border-0 p-0 hover:scale-105 transition-transform animate-assistant-pulse"
          aria-label="Abrir asistente virtual"
        >
          <span className="absolute top-2 right-2 md:top-3 md:right-3 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-10" />
          <Image
            src="/asistente-virtual-clean.png"
            alt="Moto Asistente Virtual"
            width={160}
            height={160}
            className="w-full h-full object-contain drop-shadow-[0_8px_24px_rgba(232,119,74,0.55)]"
          />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[min(360px,calc(100vw-2rem))] bg-white shadow-xl overflow-hidden font-sans border border-[#e8e8e8] z-50 rounded-2xl">
      <div className="bg-[#111111] p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Image
              src="/asistente-virtual-clean.png"
              alt="Moto Asistente Virtual"
              width={48}
              height={48}
              className="w-12 h-12 object-contain"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#111111] rounded-full" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Moto Asistente Virtual</h3>
            <p className="text-xs text-green-400">En línea · Responde al instante</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg">
          <X size={24} />
        </button>
      </div>

      <div ref={mensajesRef} className="h-[360px] bg-[#f7f7f7] p-4 overflow-y-auto flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={[
              "p-3 text-sm max-w-[85%] rounded-2xl",
              msg.from === "user"
                ? "bg-[#e8774a] text-white ml-auto rounded-br-sm"
                : "bg-white text-[#555555] border border-[#e8e8e8] rounded-bl-sm",
            ].join(" ")}
          >
            <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
          </div>
        ))}

        {loading && <TypingIndicator />}

        {!loading && (
          <div className="mt-auto pt-2">
            <p className="text-xs text-[#737373] mb-3 px-1">Preguntas frecuentes:</p>
            <div className="flex flex-wrap gap-2">
              {faqs.slice(0, 4).map((pregunta) => (
                <button
                  key={pregunta}
                  type="button"
                  onClick={() => enviarMensaje(pregunta)}
                  className="bg-white border border-[#e8e8e8] text-[#737373] py-1.5 px-3 text-xs rounded-full hover:border-[#e8774a] hover:text-[#e8774a] transition-colors"
                >
                  {pregunta}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#e8e8e8] bg-white flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Escribe tu mensaje..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviarMensaje(mensaje)}
            className="flex-1 bg-[#f7f7f7] py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-[#e8774a]/30 border border-[#e8e8e8] rounded-xl"
          />
          <button
            type="button"
            onClick={() => enviarMensaje(mensaje)}
            disabled={loading || !mensaje.trim()}
            className="bg-[#e8774a] p-3 text-white hover:bg-[#d4693e] transition-colors disabled:opacity-50 rounded-xl"
          >
            <SendHorizontal size={20} />
          </button>
        </div>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-xs text-[#737373] hover:text-[#e8774a] transition-colors"
        >
          ¿Prefieres WhatsApp? Escríbenos aquí
        </a>
      </div>
    </div>
  );
};

export default ChatWidget;
