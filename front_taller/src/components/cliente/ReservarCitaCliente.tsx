"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Send } from "lucide-react";
import { api, type Cliente } from "@/src/lib/api";
import DatePickerCita from "@/src/components/ui/DatePickerCita";
import { useCalendarioDisponibilidad } from "@/src/hooks/useCalendarioDisponibilidad";
import {
  construirFechaHoraBogota,
  generarHorariosLlegada,
  horaDentroDeAtencion,
} from "@/src/lib/fechas";

const HORARIOS_LLEGADA = generarHorariosLlegada();

const inputClass =
  "w-full bg-[#0c1017] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#6b7280] outline-none focus:border-[#ff6b2c] transition-colors";

type ReservarCitaClienteProps = {
  token: string;
  cliente: Cliente;
  compacto?: boolean;
  onReservada?: () => void;
};

export default function ReservarCitaCliente({
  token,
  cliente,
  compacto = false,
  onReservada,
}: ReservarCitaClienteProps) {
  const [servicios, setServicios] = useState<{ id: string; titulo: string }[]>([]);
  const [form, setForm] = useState({
    mensaje: "",
    fechaPreferida: "",
    horaPreferida: "",
    servicioId: "",
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const { fechasBloqueadas, recepciones, refrescar } = useCalendarioDisponibilidad();

  useEffect(() => {
    api.getServicios().then(setServicios).catch(() => setServicios([]));
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
      const result = await api.reservarCitaCliente(token, {
        mensaje: form.mensaje.trim() || undefined,
        fechaPreferida: construirFechaHoraBogota(form.fechaPreferida, form.horaPreferida),
        servicioId: form.servicioId || undefined,
      });

      let mensaje = result.message;
      if (result.calendarSync?.synced) {
        mensaje += " Tu cita quedó agendada.";
      }

      setFeedback({ type: "ok", text: mensaje });
      await refrescar();
      setForm({ mensaje: "", fechaPreferida: "", horaPreferida: "", servicioId: "" });
      onReservada?.();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo reservar la cita",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <article
      className={[
        "rounded-2xl bg-[#161d2b] border border-white/5",
        compacto ? "p-4 sm:p-5" : "p-5 sm:p-6",
      ].join(" ")}
    >
      <div className="flex items-start gap-3 mb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff6b2c]/15 text-[#ff6b2c]">
          <CalendarPlus size={20} />
        </div>
        <div>
          <h3 className="text-base font-semibold sm:text-lg">Reservar cita</h3>
          <p className="text-sm text-[#9ca3af] mt-0.5">
            Agenda sin salir de tu cuenta. Usaremos tus datos registrados.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-[#0c1017] border border-white/5 px-4 py-3 text-sm">
        <p className="text-white font-medium">{cliente.nombre}</p>
        <p className="text-[#9ca3af] mt-1">{cliente.email}</p>
        <p className="text-[#9ca3af]">{cliente.telefono}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9ca3af] mb-3">
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9ca3af] mb-3">
            Hora de llegada
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
          <p className="text-xs text-[#6b7280] mt-2">Horario: 8:00 a.m. – 6:00 p.m.</p>
        </div>

        <textarea
          placeholder="¿Qué necesita tu moto? (opcional)"
          rows={3}
          value={form.mensaje}
          onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
          className={`${inputClass} resize-none`}
        />

        {feedback && (
          <p
            className={`text-sm ${feedback.type === "ok" ? "text-emerald-400" : "text-red-400"}`}
          >
            {feedback.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6b2c] hover:bg-[#e85d22] disabled:opacity-50 text-white text-sm font-semibold py-3.5 px-6 transition-colors w-full sm:w-auto"
        >
          <Send size={16} />
          {loading ? "Reservando..." : "Confirmar reserva"}
        </button>
      </form>
    </article>
  );
}
