"use client";

import React, { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { api, type ConfigTaller, type Servicio } from "@/src/lib/api";
import { WHATSAPP_URL, WHATSAPP_DISPLAY } from "@/src/lib/contact";
import DatePickerCita from "@/src/components/ui/DatePickerCita";
import { useCalendarioDisponibilidad } from "@/src/hooks/useCalendarioDisponibilidad";
import { construirFechaHoraBogota, generarHorariosLlegada, horaDentroDeAtencion } from "@/src/lib/fechas";

const HORARIOS_LLEGADA = generarHorariosLlegada();

const inputClass =
  "w-full bg-white border border-[#e8e8e8] px-4 py-3 text-sm text-[#111111] placeholder:text-[#a3a3a3] outline-none focus:border-[#111111] transition-colors";

const ContactPage = () => {
  const [config, setConfig] = useState<ConfigTaller | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    mensaje: "",
    fechaPreferida: "",
    horaPreferida: "",
    servicioId: "",
  });
  const [loading, setLoading] = useState(false);
  const { fechasBloqueadas, recepciones, refrescar } = useCalendarioDisponibilidad();
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([api.getConfig(), api.getServicios()])
      .then(([configData, serviciosData]) => {
        setConfig(configData);
        setServicios(serviciosData);
      })
      .catch(() => {
        setConfig({
          whatsapp: "+57 314 490 2016",
          telefono: "+57 322 680 7105",
          direccion: "Calle 92sur #4a-29, Barrio el virrey",
          horario: null,
        });
      });
  }, []);

  useEffect(() => {
    if (form.fechaPreferida && fechasBloqueadas.includes(form.fechaPreferida)) {
      setForm((prev) => ({ ...prev, fechaPreferida: "", horaPreferida: "" }));
    }
  }, [fechasBloqueadas, form.fechaPreferida]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    if (!form.fechaPreferida) {
      setFeedback({ type: "error", text: "Selecciona la fecha en la que puedes llevar la moto." });
      setLoading(false);
      return;
    }

    if (!form.horaPreferida) {
      setFeedback({ type: "error", text: "Indica la hora en la que puedes llevar la moto." });
      setLoading(false);
      return;
    }

    if (!horaDentroDeAtencion(form.horaPreferida)) {
      setFeedback({
        type: "error",
        text: "La hora debe estar entre las 8:00 a.m. y las 6:00 p.m.",
      });
      setLoading(false);
      return;
    }

    try {
      const result = await api.crearCita({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim() || undefined,
        mensaje: form.mensaje.trim() || undefined,
        fechaPreferida: construirFechaHoraBogota(form.fechaPreferida, form.horaPreferida),
        servicioId: form.servicioId || undefined,
      });

      let mensaje = result.message;
      if (result.calendarSync?.synced) {
        mensaje += " Tu cita quedó agendada.";
      } else if (result.calendarSync?.error) {
        mensaje += ` (${result.calendarSync.error})`;
      }

      setFeedback({ type: "ok", text: mensaje });
      await refrescar();
      setForm({
        nombre: "",
        telefono: "",
        email: "",
        mensaje: "",
        fechaPreferida: "",
        horaPreferida: "",
        servicioId: "",
      });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "No se pudo enviar la solicitud";
      setFeedback({
        type: "error",
        text:
          mensaje === "Failed to fetch" || mensaje === "fetch failed"
            ? "No se pudo conectar con el servidor."
            : mensaje,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 md:py-32 bg-[#f7f7f7] border-t border-[#e8e8e8]">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="max-w-xl mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-[#737373] mb-4">Contacto</p>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-[#111111] mb-4">
            Agenda tu cita
          </h2>
          <p className="text-[#737373] leading-relaxed">
            Completa el formulario o escríbenos directamente. Respuesta en menos de 2 horas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 lg:items-stretch">
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#737373] mb-2">WhatsApp</p>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#111111] hover:text-[#e8774a] transition-colors"
                >
                  {config?.whatsapp ?? WHATSAPP_DISPLAY}
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-[#737373] mb-2">Teléfono</p>
                <p className="text-[#111111]">{config?.telefono ?? "+57 322 680 7105"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-[#737373] mb-2">Dirección</p>
                <p className="text-[#111111] leading-relaxed">
                  {config?.direccion ?? "Calle 92sur #4a-29, Barrio el virrey"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
            <input
              required
              type="text"
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={inputClass}
            />
            <input
              required
              type="tel"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className={inputClass}
            />
            <input
              type="email"
              placeholder="Email (opcional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
            <select
              value={form.servicioId}
              onChange={(e) => setForm({ ...form, servicioId: e.target.value })}
              className={inputClass}
            >
              <option value="">Servicio (opcional)</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titulo}
                </option>
              ))}
            </select>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#737373] mb-3">
                Fecha para llevar la moto
              </p>
              <DatePickerCita
                value={form.fechaPreferida}
                onChange={(fechaPreferida) =>
                  setForm((prev) => ({
                    ...prev,
                    fechaPreferida,
                    horaPreferida: fechaPreferida ? prev.horaPreferida : "",
                  }))
                }
                fechasBloqueadas={fechasBloqueadas}
                recepciones={recepciones}
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#737373] mb-3">
                Hora en que puedes llevar la moto
              </p>
              <select
                required
                disabled={!form.fechaPreferida}
                value={form.horaPreferida}
                onChange={(e) => setForm({ ...form, horaPreferida: e.target.value })}
                className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="">Selecciona una hora</option>
                {HORARIOS_LLEGADA.map((horario) => (
                  <option key={horario.value} value={horario.value}>
                    {horario.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#737373] mt-2">
                {config?.horario ?? "Horario del taller: 8:00 a.m. – 6:00 p.m."}
              </p>
            </div>
            <textarea
              placeholder="¿Qué necesita tu moto?"
              rows={3}
              value={form.mensaje}
              onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
              className={`${inputClass} resize-none`}
            />

            {feedback && (
              <p
                className={`text-sm ${feedback.type === "ok" ? "text-[#111111]" : "text-red-600"}`}
              >
                {feedback.text}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-[#111111] hover:bg-[#333333] disabled:opacity-50 text-white text-sm font-medium py-3.5 px-6 transition-colors w-fit mt-2"
            >
              <Send size={16} />
              {loading ? "Enviando..." : "Enviar solicitud"}
            </button>
            </form>
          </div>

          <div className="relative min-h-[360px] sm:min-h-[420px] lg:min-h-0 lg:h-full bg-white border border-[#e8e8e8] overflow-hidden">
            <iframe
              title="Ubicación del taller"
              src="https://www.google.com/maps/embed?pb=!4v1768600543893!6m8!1m7!1sW06QOzluRnuyTKNjBiKdxA!2m2!1d4.500475058566445!2d-74.10978571204576!3f260.690791112366!4f-12.694446639126284!5f0.7820865974627469"
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
