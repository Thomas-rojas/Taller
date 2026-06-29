"use client";

import { useEffect, useState } from "react";
import { MessageSquareQuote, Send } from "lucide-react";
import { api, type Testimonio } from "@/src/lib/api";

type ClienteTestimonioProps = {
  token: string;
  nombre: string;
};

export default function ClienteTestimonio({ token, nombre }: ClienteTestimonioProps) {
  const [moto, setMoto] = useState("");
  const [texto, setTexto] = useState("");
  const [publicado, setPublicado] = useState<Testimonio | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    api
      .getMiTestimonioCliente(token)
      .then((data) => {
        if (data.testimonio) {
          setPublicado(data.testimonio);
          setMoto(data.testimonio.moto);
          setTexto(data.testimonio.texto);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [token]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setEnviando(true);
    try {
      const result = await api.publicarTestimonioCliente(token, {
        moto: moto.trim(),
        texto: texto.trim(),
      });
      setPublicado(result.testimonio);
      setFeedback({
        type: "ok",
        text: publicado
          ? "Testimonio actualizado. Ya aparece en la página principal."
          : result.message,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo publicar el testimonio",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <article className="rounded-2xl bg-[#161d2b] border border-white/5 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquareQuote className="text-[#ff6b2c]" size={20} />
        <h3 className="text-base font-semibold">Tu testimonio</h3>
      </div>
      <p className="text-sm text-[#9ca3af] mb-5 leading-relaxed">
        Tu moto ya fue entregada. Comparte tu experiencia en el taller: tu nombre se publica
        automáticamente en la sección de testimonios del sitio.
      </p>

      {loading ? (
        <p className="text-sm text-[#9ca3af]">Cargando...</p>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-[#9ca3af] mb-1.5 block">
              Tu nombre
            </label>
            <input
              type="text"
              readOnly
              value={nombre}
              className="w-full rounded-xl bg-[#0c1017] border border-white/10 px-4 py-3 text-sm text-white/80 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-[#9ca3af] mb-1.5 block">
              Tu moto <span className="text-[#ff6b2c]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={80}
              placeholder="Ej: Yamaha FZ 150, Honda CB 190R..."
              value={moto}
              onChange={(e) => setMoto(e.target.value)}
              className="w-full rounded-xl bg-[#0c1017] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#ff6b2c]/50 focus:ring-1 focus:ring-[#ff6b2c]/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-[#9ca3af] mb-1.5 block">
              Tu experiencia <span className="text-[#ff6b2c]">*</span>
            </label>
            <textarea
              required
              rows={4}
              maxLength={500}
              placeholder="Cuéntanos cómo fue tu visita al taller, la atención que recibiste, el resultado del servicio..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="w-full rounded-xl bg-[#0c1017] border border-white/10 px-4 py-3 text-sm outline-none resize-none focus:border-[#ff6b2c]/50 focus:ring-1 focus:ring-[#ff6b2c]/30"
            />
            <p className="text-xs text-[#6b7280] mt-1 text-right">{texto.length}/500</p>
          </div>

          {feedback && (
            <p
              className={`text-sm ${feedback.type === "ok" ? "text-green-400" : "text-red-400"}`}
            >
              {feedback.text}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#ff6b2c] hover:bg-[#e85f24] disabled:opacity-60 py-3.5 text-sm font-semibold transition-colors"
          >
            <Send size={16} />
            {enviando
              ? "Publicando..."
              : publicado
                ? "Actualizar testimonio"
                : "Publicar en la página principal"}
          </button>
        </form>
      )}
    </article>
  );
}
