"use client";

import React, { useEffect, useState } from "react";
import { MessageCircle, Phone, MapPin, Clock, Send } from "lucide-react";
import { api, type ConfigTaller, type Servicio } from "@/src/lib/api";
import { WHATSAPP_URL, WHATSAPP_DISPLAY } from "@/src/lib/contact";
import DatePickerCita from "@/src/components/ui/DatePickerCita";
import { useCalendarioDisponibilidad } from "@/src/hooks/useCalendarioDisponibilidad";

const ContactPage = () => {
  const [config, setConfig] = useState<ConfigTaller | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    mensaje: "",
    fechaPreferida: "",
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
      setForm((prev) => ({ ...prev, fechaPreferida: "" }));
    }
  }, [fechasBloqueadas, form.fechaPreferida]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const result = await api.crearCita({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim() || undefined,
        mensaje: form.mensaje.trim() || undefined,
        fechaPreferida: form.fechaPreferida
          ? `${form.fechaPreferida}T12:00:00.000Z`
          : undefined,
        servicioId: form.servicioId || undefined,
      });

      let mensaje = result.message;
      if (result.calendarSync?.synced) {
        mensaje += " Tu cita quedó agendada en Google Calendar.";
      } else if (result.calendarSync?.error) {
        mensaje += ` (Aviso: ${result.calendarSync.error})`;
      }

      setFeedback({
        type: result.calendarSync?.synced ? "ok" : "ok",
        text: mensaje,
      });
      await refrescar();
      setForm({
        nombre: "",
        telefono: "",
        email: "",
        mensaje: "",
        fechaPreferida: "",
        servicioId: "",
      });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "No se pudo enviar la solicitud";

      setFeedback({
        type: "error",
        text:
          mensaje === "Failed to fetch" || mensaje === "fetch failed"
            ? "No se pudo conectar con el servidor. Verifica que el backend esté corriendo en el puerto 4000."
            : mensaje,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Agenda Tu Cita Hoy</h1>
        <p className="text-gray-400 text-lg mb-4">Escríbenos, aquí te atendemos con gusto</p>
        <div className="flex items-center justify-center text-orange-400 gap-2">
          <Clock size={20} />
          <span className="font-medium">Respuesta en menos de 2 horas</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-8">
          <div className="bg-[#1a1a1a] p-8 rounded-3xl flex flex-col gap-6">
            <h2 className="text-2xl font-bold mb-2">Contáctanos</h2>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl border border-green-500/50 bg-green-500/5 hover:bg-green-500/10 transition-colors"
            >
              <div className="bg-green-500 p-3 rounded-full">
                <MessageCircle size={24} className="text-white fill-current" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">WhatsApp</p>
                <p className="text-xl font-semibold">{config?.whatsapp ?? WHATSAPP_DISPLAY}</p>
              </div>
            </a>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#262626]">
              <div className="bg-orange-500 p-3 rounded-full">
                <Phone size={24} className="text-white fill-current" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Teléfono</p>
                <p className="text-xl font-semibold">{config?.telefono ?? "+57 322 680 7105"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#262626]">
              <div className="bg-orange-500 p-3 rounded-full">
                <MapPin size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Dirección</p>
                <p className="text-lg font-semibold">
                  {config?.direccion ?? "Calle 92sur #4a-29, Barrio el virrey"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-[#1a1a1a] p-8 rounded-3xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Solicitar cita</h2>

            <input
              required
              type="text"
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="bg-[#262626] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              required
              type="tel"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="bg-[#262626] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="email"
              placeholder="Email (opcional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-[#262626] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            />
            <select
              value={form.servicioId}
              onChange={(e) => setForm({ ...form, servicioId: e.target.value })}
              className="bg-[#262626] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Selecciona un servicio (opcional)</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titulo}
                </option>
              ))}
            </select>
            <div>
              <p className="text-sm text-gray-400 mb-2">Fecha preferida (opcional)</p>
              <DatePickerCita
                value={form.fechaPreferida}
                onChange={(fechaPreferida) => setForm({ ...form, fechaPreferida })}
                fechasBloqueadas={fechasBloqueadas}
                recepciones={recepciones}
              />
            </div>
            <textarea
              placeholder="Cuéntanos qué necesita tu moto"
              rows={3}
              value={form.mensaje}
              onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
              className="bg-[#262626] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />

            {feedback && (
              <p
                className={`text-sm ${feedback.type === "ok" ? "text-green-400" : "text-red-400"}`}
              >
                {feedback.text}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-colors"
            >
              <Send size={18} />
              {loading ? "Enviando..." : "Enviar solicitud"}
            </button>
          </form>
        </div>

        <div className="relative h-[400px] lg:h-auto min-h-[450px] rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-gray-800">
          <iframe
            title="Ubicación"
            src="https://www.google.com/maps/embed?pb=!4v1768600543893!6m8!1m7!1sW06QOzluRnuyTKNjBiKdxA!2m2!1d4.500475058566445!2d-74.10978571204576!3f260.690791112366!4f-12.694446639126284!5f0.7820865974627469"
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
