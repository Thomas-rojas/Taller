"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bike,
  Calendar,
  Check,
  History,
  Lock,
  LogOut,
  PackageCheck,
  PackageOpen,
  Plus,
  Search,
  Send,
  Trash2,
  Camera,
  UserCheck,
  Video,
  X,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { api, type Cita, type CitaPendienteRevision, type HistorialTrabajo, type Mecanico, type MecanicoConTrabajos } from "@/src/lib/api";
import { hoyISO } from "@/src/lib/fechas";
import { type ItemTrabajoForm, crearFotoTrabajo, formDesdeTrabajoBorrador, fotoTrabajoPersistida, liberarPreviewsTrabajo, trabajoTieneContenidoParaBorrador, trabajoVacio } from "@/src/lib/trabajos";
import { recepcionVacia } from "@/src/lib/estadoIngreso";
import AuthMecanico from "@/src/components/mecanico/AuthMecanico";
import TrabajosDisplay from "@/src/components/mecanico/TrabajosDisplay";
import EstadoIngresoDisplay from "@/src/components/mecanico/EstadoIngresoDisplay";

const STORAGE_KEY = "moto-taller-mecanico-token";
const STORAGE_NOMBRE = "moto-taller-mecanico-nombre";

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  recibida: "En taller",
  finalizada: "En control de calidad",
  lista_retiro: "Cliente avisado — entrega",
  entregada: "Entregada al cliente",
  cancelada: "Cancelada",
};

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "text-yellow-400",
  confirmada: "text-blue-400",
  recibida: "text-orange-400",
  finalizada: "text-purple-400",
  lista_retiro: "text-green-400",
  entregada: "text-green-400",
  cancelada: "text-gray-500",
};

const TIPO_ID_LABEL: Record<string, string> = {
  cedula: "Cédula",
  pasaporte: "Pasaporte",
  cedula_extranjeria: "Cédula extranjería",
  tarjeta_identidad: "Tarjeta de identidad",
};

function fechaRecepcionISO(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatearFecha(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatearFechaHora(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function entregaInicial() {
  return { placa: "", trabajos: [trabajoVacio()] };
}

export default function MecanicoPage() {
  const [token, setToken] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [esAdmin, setEsAdmin] = useState(false);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pendientes, setPendientes] = useState<Mecanico[]>([]);
  const [historialTrabajos, setHistorialTrabajos] = useState<HistorialTrabajo[]>([]);
  const [pendientesRevision, setPendientesRevision] = useState<CitaPendienteRevision[]>([]);
  const [mecanicosConTrabajos, setMecanicosConTrabajos] = useState<MecanicoConTrabajos[]>([]);
  const [filtroMecanico, setFiltroMecanico] = useState("");
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [whatsappEstado, setWhatsappEstado] = useState<{
    proveedor: "green-api" | "meta-cloud" | "whatsapp-web" | "ninguno";
    greenApiConfigurado: boolean;
    automaticoHabilitado: boolean;
    habilitado: boolean;
    conectado: boolean;
    qrDisponible: boolean;
    qrDataUrl: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [recepcionForm, setRecepcionForm] = useState<
    Record<string, ReturnType<typeof recepcionVacia>>
  >({});
  const [recepcionAbierta, setRecepcionAbierta] = useState<Record<string, boolean>>({});
  const [fechasEntrega, setFechasEntrega] = useState<Record<string, string>>({});
  const [entregaForm, setEntregaForm] = useState<
    Record<string, { placa: string; trabajos: ItemTrabajoForm[] }>
  >({});
  const [fotosObligatoriasError, setFotosObligatoriasError] = useState<
    Record<string, boolean>
  >({});
  const [borradorEstado, setBorradorEstado] = useState<
    Record<string, "idle" | "guardando" | "guardado" | "error">
  >({});
  const entregaFormInicializado = useRef<Set<string>>(new Set());
  const autosaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const entregaFormRef = useRef(entregaForm);
  entregaFormRef.current = entregaForm;
  const [busquedaFecha, setBusquedaFecha] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    const nombre = sessionStorage.getItem(STORAGE_NOMBRE);
    if (saved) setToken(saved);
    if (nombre) setNombreUsuario(nombre);
  }, []);

  const cargarPerfil = useCallback(async (key: string) => {
    try {
      const perfil = await api.getPerfilMecanico(key);
      setEsAdmin(perfil.tipo === "legacy" && perfil.rol === "admin");
      if (perfil.mecanico) {
        setNombreUsuario(`${perfil.mecanico.nombre} ${perfil.mecanico.apellidos}`);
      }
    } catch {
      setEsAdmin(false);
    }
  }, []);

  const cargarCitas = useCallback(async (key: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await api.getCitas(key);
      setCitas(data);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudieron cargar las citas",
      });
      if (error instanceof Error && error.message.includes("401")) {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_NOMBRE);
        setToken("");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarPendientes = useCallback(async (key: string) => {
    try {
      const data = await api.getMecanicosPendientes(key);
      setPendientes(data);
    } catch {
      setPendientes([]);
    }
  }, []);

  const cargarDatosAdmin = useCallback(async (key: string, mecanicoId?: string) => {
    setLoadingAdmin(true);
    try {
      const [historialData, whatsapp, pendientes] = await Promise.all([
        api.getHistorialMecanicos(key, mecanicoId || undefined),
        api.getWhatsAppEstado(key).catch(() => null),
        api.getMotosPendientesRevision(key).catch(() => []),
      ]);
      setHistorialTrabajos(historialData.historial);
      setMecanicosConTrabajos(historialData.mecanicos);
      setWhatsappEstado(whatsapp);
      setPendientesRevision(pendientes);
    } catch {
      setHistorialTrabajos([]);
      setMecanicosConTrabajos([]);
      setWhatsappEstado(null);
      setPendientesRevision([]);
    } finally {
      setLoadingAdmin(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    cargarPerfil(token);
  }, [token, cargarPerfil]);

  useEffect(() => {
    if (!token) return;
    cargarCitas(token);
  }, [token, cargarCitas]);

  useEffect(() => {
    if (token && esAdmin) {
      cargarPendientes(token);
      cargarDatosAdmin(token, filtroMecanico);
    }
  }, [token, esAdmin, filtroMecanico, cargarPendientes, cargarDatosAdmin]);

  useEffect(() => {
    if (!token || !esAdmin) return;
    const intervalo = setInterval(() => {
      cargarCitas(token);
    }, 30000);
    return () => clearInterval(intervalo);
  }, [token, esAdmin, cargarCitas]);

  useEffect(() => {
    if (!token || !esAdmin || !whatsappEstado?.automaticoHabilitado || whatsappEstado?.conectado)
      return;

    const intervalo = setInterval(() => {
      api.getWhatsAppEstado(token).then(setWhatsappEstado).catch(() => null);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [token, esAdmin, whatsappEstado?.automaticoHabilitado, whatsappEstado?.conectado]);

  useEffect(() => {
    setEntregaForm((prev) => {
      let cambio = false;
      const next = { ...prev };

      for (const cita of citas) {
        if (cita.estado !== "recibida" || cita.datosReparacionBloqueados) continue;
        if (!cita.descripcionTrabajo) continue;
        if (entregaFormInicializado.current.has(cita.id)) continue;

        const restaurado = formDesdeTrabajoBorrador(cita.descripcionTrabajo);
        if (restaurado) {
          next[cita.id] = {
            placa: cita.placa?.trim().toUpperCase() ?? "",
            trabajos: restaurado.trabajos,
          };
          entregaFormInicializado.current.add(cita.id);
          cambio = true;
        }
      }

      return cambio ? next : prev;
    });
  }, [citas]);

  const aplicarBorradorGuardado = useCallback((citaId: string, descripcionTrabajo: string | null) => {
    const restaurado = formDesdeTrabajoBorrador(descripcionTrabajo);
    if (!restaurado) return;

    setEntregaForm((prev) => {
      const actual = prev[citaId];
      if (!actual) return { ...prev, [citaId]: restaurado };

      const trabajos = actual.trabajos.map((local, index) => {
        const servidor = restaurado.trabajos[index];
        if (!servidor) return local;

        return {
          parte: local.parte,
          descripcion: local.descripcion,
          fotosViejos: [
            ...servidor.fotosViejos,
            ...local.fotosViejos.filter((foto) => foto.file),
          ],
          fotosNuevos: [
            ...servidor.fotosNuevos,
            ...local.fotosNuevos.filter((foto) => foto.file),
          ],
        };
      });

      return {
        ...prev,
        [citaId]: {
          placa: actual.placa || restaurado.placa,
          trabajos,
        },
      };
    });
  }, []);

  const guardarBorradorTrabajo = useCallback(
    async (citaId: string) => {
      if (!token) return;
      const datos = entregaFormRef.current[citaId];
      if (!datos) return;

      const trabajosConContenido = datos.trabajos.filter(trabajoTieneContenidoParaBorrador);
      if (trabajosConContenido.length === 0) return;

      setBorradorEstado((prev) => ({ ...prev, [citaId]: "guardando" }));
      try {
        const result = await api.guardarTrabajoBorrador(token, citaId, {
          placa: datos.placa,
          trabajos: datos.trabajos,
        });
        aplicarBorradorGuardado(citaId, result.cita.descripcionTrabajo);
        entregaFormInicializado.current.add(citaId);
        setBorradorEstado((prev) => ({ ...prev, [citaId]: "guardado" }));
        setTimeout(() => {
          setBorradorEstado((prev) =>
            prev[citaId] === "guardado" ? { ...prev, [citaId]: "idle" } : prev,
          );
        }, 2500);
      } catch {
        setBorradorEstado((prev) => ({ ...prev, [citaId]: "error" }));
      }
    },
    [token, aplicarBorradorGuardado],
  );

  const programarGuardadoBorrador = useCallback(
    (citaId: string) => {
      entregaFormInicializado.current.add(citaId);
      if (autosaveTimers.current[citaId]) {
        clearTimeout(autosaveTimers.current[citaId]);
      }
      autosaveTimers.current[citaId] = setTimeout(() => {
        void guardarBorradorTrabajo(citaId);
      }, 1500);
    },
    [guardarBorradorTrabajo],
  );

  const handleLogin = (newToken: string, nombre?: string) => {
    sessionStorage.setItem(STORAGE_KEY, newToken);
    if (nombre) sessionStorage.setItem(STORAGE_NOMBRE, nombre);
    setToken(newToken);
    if (nombre) setNombreUsuario(nombre);
  };

  const cerrarSesion = async () => {
    try {
      if (token) await api.logoutMecanico(token);
    } catch {
      /* sesión legacy o ya expirada */
    }
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_NOMBRE);
    setToken("");
    setNombreUsuario("");
    setCitas([]);
    setPendientes([]);
    setHistorialTrabajos([]);
    setMecanicosConTrabajos([]);
    setFiltroMecanico("");
    setEsAdmin(false);
  };

  const aprobarMecanico = async (id: string) => {
    if (!token) return;
    setFeedback(null);
    try {
      const result = await api.aprobarMecanico(token, id);
      setFeedback({ type: "ok", text: result.message });
      await cargarPendientes(token);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo aprobar",
      });
    }
  };

  const rechazarMecanico = async (id: string) => {
    if (!token) return;
    setFeedback(null);
    try {
      const result = await api.rechazarMecanico(token, id);
      setFeedback({ type: "ok", text: result.message });
      await cargarPendientes(token);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo rechazar",
      });
    }
  };

  const obtenerEntregaForm = (citaId: string) => entregaForm[citaId] ?? entregaInicial();

  const actualizarPlaca = (citaId: string, placa: string) => {
    setEntregaForm((prev) => {
      const actual = prev[citaId] ?? entregaInicial();
      return { ...prev, [citaId]: { ...actual, placa: placa.toUpperCase() } };
    });
    programarGuardadoBorrador(citaId);
  };

  const actualizarTrabajo = (
    citaId: string,
    index: number,
    campo: "parte" | "descripcion",
    valor: string,
  ) => {
    setEntregaForm((prev) => {
      const actual = prev[citaId] ?? entregaInicial();
      const trabajos = actual.trabajos.map((item, i) =>
        i === index ? { ...item, [campo]: valor } : item,
      );
      return { ...prev, [citaId]: { ...actual, trabajos } };
    });
    programarGuardadoBorrador(citaId);
  };

  const agregarFotoTrabajo = (
    citaId: string,
    index: number,
    tipo: "viejo" | "nuevo",
    file: File,
  ) => {
    const campo = tipo === "viejo" ? "fotosViejos" : "fotosNuevos";
    setEntregaForm((prev) => {
      const actual = prev[citaId] ?? entregaInicial();
      const trabajos = actual.trabajos.map((item, i) => {
        if (i !== index) return item;
        const nueva = crearFotoTrabajo();
        nueva.file = file;
        nueva.preview = URL.createObjectURL(file);
        return { ...item, [campo]: [...item[campo], nueva] };
      });
      return { ...prev, [citaId]: { ...actual, trabajos } };
    });
    setFotosObligatoriasError((prev) => {
      if (!prev[citaId]) return prev;
      const { ...rest } = prev;
      delete rest[citaId];
      return rest;
    });
    programarGuardadoBorrador(citaId);
  };

  const quitarFotoTrabajo = (
    citaId: string,
    index: number,
    tipo: "viejo" | "nuevo",
    fotoIndex: number,
  ) => {
    const campo = tipo === "viejo" ? "fotosViejos" : "fotosNuevos";
    setEntregaForm((prev) => {
      const actual = prev[citaId] ?? entregaInicial();
      const trabajos = actual.trabajos.map((item, i) => {
        if (i !== index) return item;
        const removida = item[campo][fotoIndex];
        if (removida?.preview?.startsWith("blob:")) URL.revokeObjectURL(removida.preview);
        return {
          ...item,
          [campo]: item[campo].filter((_, j) => j !== fotoIndex),
        };
      });
      return { ...prev, [citaId]: { ...actual, trabajos } };
    });
    programarGuardadoBorrador(citaId);
  };

  const agregarTrabajo = (citaId: string) => {
    setEntregaForm((prev) => {
      const actual = prev[citaId] ?? entregaInicial();
      return {
        ...prev,
        [citaId]: { ...actual, trabajos: [...actual.trabajos, trabajoVacio()] },
      };
    });
    programarGuardadoBorrador(citaId);
  };

  const quitarTrabajo = (citaId: string, index: number) => {
    setEntregaForm((prev) => {
      const actual = prev[citaId] ?? entregaInicial();
      if (actual.trabajos.length <= 1) return prev;
      const removido = actual.trabajos[index];
      liberarPreviewsTrabajo(removido);
      return {
        ...prev,
        [citaId]: {
          ...actual,
          trabajos: actual.trabajos.filter((_, i) => i !== index),
        },
      };
    });
    programarGuardadoBorrador(citaId);
  };

  const abrirRecepcion = (citaId: string) => {
    setRecepcionAbierta((prev) => ({ ...prev, [citaId]: true }));
  };

  const cancelarRecepcion = (citaId: string) => {
    const actual = recepcionForm[citaId];
    actual?.medios.forEach((medio) => {
      if (medio.preview) URL.revokeObjectURL(medio.preview);
    });
    setRecepcionForm((prev) => {
      const next = { ...prev };
      delete next[citaId];
      return next;
    });
    setRecepcionAbierta((prev) => ({ ...prev, [citaId]: false }));
  };

  const obtenerRecepcionForm = (citaId: string) => recepcionForm[citaId] ?? recepcionVacia();

  const actualizarDescripcionRecepcion = (citaId: string, descripcion: string) => {
    setRecepcionForm((prev) => ({
      ...prev,
      [citaId]: { ...(prev[citaId] ?? recepcionVacia()), descripcion },
    }));
  };

  const agregarMedioRecepcion = (citaId: string, file: File, tipo: "foto" | "video") => {
    setRecepcionForm((prev) => {
      const actual = prev[citaId] ?? recepcionVacia();
      return {
        ...prev,
        [citaId]: {
          ...actual,
          medios: [
            ...actual.medios,
            { file, preview: URL.createObjectURL(file), tipo },
          ],
        },
      };
    });
  };

  const quitarMedioRecepcion = (citaId: string, index: number) => {
    setRecepcionForm((prev) => {
      const actual = prev[citaId] ?? recepcionVacia();
      const removido = actual.medios[index];
      if (removido?.preview) URL.revokeObjectURL(removido.preview);
      return {
        ...prev,
        [citaId]: {
          ...actual,
          medios: actual.medios.filter((_, i) => i !== index),
        },
      };
    });
  };

  const confirmarCita = async (cita: Cita) => {
    if (!token) return;
    setFeedback(null);
    try {
      const result = await api.confirmarCita(token, cita.id);
      const partes = [result.message];
      if (result.notificacion.correoEnviado) {
        partes.push(`✓ Correo a ${cita.email}`);
      }
      if (result.notificacion.whatsappEnviado) {
        partes.push(`✓ WhatsApp a ${cita.telefono}`);
      } else if (cita.telefono?.trim() && whatsappEstado?.automaticoHabilitado) {
        if (result.notificacion.whatsappError) {
          partes.push(`⚠ WhatsApp: ${result.notificacion.whatsappError}`);
        } else if (!whatsappEstado.conectado) {
          partes.push("⚠ WhatsApp no conectado — escanea el QR arriba");
        }
      }
      setFeedback({ type: "ok", text: partes.join(" · ") });
      await cargarCitas(token);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo confirmar la cita",
      });
    }
  };

  const reenviarConfirmacion = async (cita: Cita) => {
    if (!token) return;
    setFeedback(null);
    try {
      const result = await api.reenviarConfirmacionCita(token, cita.id);
      const partes = [result.message];
      if (result.notificacion.whatsappEnviado) {
        partes.push(`✓ WhatsApp a ${cita.telefono}`);
      } else if (cita.telefono?.trim() && whatsappEstado?.automaticoHabilitado) {
        if (result.notificacion.whatsappError) {
          partes.push(`⚠ WhatsApp: ${result.notificacion.whatsappError}`);
        } else if (!whatsappEstado.conectado) {
          partes.push("⚠ WhatsApp no conectado — escanea el QR arriba");
        }
      }
      setFeedback({ type: "ok", text: partes.join(" · ") });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo reenviar la confirmación",
      });
    }
  };

  const recibirMoto = async (cita: Cita) => {
    if (!token) return;

    const datos = obtenerRecepcionForm(cita.id);
    if (!datos.descripcion.trim()) {
      setFeedback({
        type: "error",
        text: "Describe el estado de la moto cuando ingresó al taller.",
      });
      return;
    }
    if (datos.medios.length === 0) {
      setFeedback({
        type: "error",
        text: "Agrega al menos una foto o un video del estado de la moto.",
      });
      return;
    }

    setFeedback(null);
    try {
      const result = await api.recibirMoto(token, cita.id, datos);
      setFeedback({ type: "ok", text: result.message });
      cancelarRecepcion(cita.id);
      await cargarCitas(token);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo registrar la recepción",
      });
    }
  };

  const finalizarMoto = async (cita: Cita) => {
    if (!token) return;
    const datos = obtenerEntregaForm(cita.id);
    const fechaEntrega = fechasEntrega[cita.id] || hoyISO();

    if (!datos.placa.trim()) {
      setFeedback({ type: "error", text: "Ingresa la placa de la moto." });
      return;
    }

    const trabajosValidos = datos.trabajos.filter(
      (t) => t.parte.trim() && t.descripcion.trim(),
    );

    if (trabajosValidos.length === 0) {
      setFeedback({
        type: "error",
        text: "Completa al menos una pieza y qué se le hizo.",
      });
      return;
    }

    const incompleto = datos.trabajos.some(
      (t) => (t.parte.trim() && !t.descripcion.trim()) || (!t.parte.trim() && t.descripcion.trim()),
    );
    if (incompleto) {
      setFeedback({
        type: "error",
        text: "Cada trabajo debe tener la pieza y la descripción completas.",
      });
      return;
    }

    const sinFotosCompletas = trabajosValidos.some(
      (t) => t.fotosViejos.length === 0 || t.fotosNuevos.length === 0,
    );
    if (sinFotosCompletas) {
      setFotosObligatoriasError((prev) => ({ ...prev, [cita.id]: true }));
      setFeedback({
        type: "error",
        text: "Cada trabajo debe tener al menos una foto de repuesto viejo y una de repuesto nuevo.",
      });
      return;
    }

    const fotosSinGuardar = trabajosValidos.some(
      (t) =>
        t.fotosViejos.some((f) => !fotoTrabajoPersistida(f)) ||
        t.fotosNuevos.some((f) => !fotoTrabajoPersistida(f)),
    );
    if (fotosSinGuardar) {
      setFeedback({
        type: "error",
        text: "Hay fotos que aún no se guardaron. Espera un momento o vuelve a agregarlas.",
      });
      return;
    }

    setFeedback(null);
    try {
      const result = await api.entregarMoto(token, cita.id, {
        fechaEntrega,
        placa: datos.placa.trim(),
        trabajos: trabajosValidos,
      });
      setFeedback({ type: "ok", text: result.message });
      await cargarCitas(token);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo finalizar el trabajo",
      });
    }
  };

  const avisarRetiroCliente = async (citaId: string) => {
    if (!token) return;
    setFeedback(null);
    try {
      const result = await api.notificarRetiroCliente(token, citaId);
      setFeedback({ type: "ok", text: result.message });
      await cargarDatosAdmin(token, filtroMecanico);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo avisar al cliente",
      });
    }
  };

  const entregarMotoCliente = async (cita: Cita) => {
    if (!token) return;
    setFeedback(null);
    try {
      const result = await api.entregarMotoCliente(token, cita.id);
      setFeedback({ type: "ok", text: result.message });
      await cargarCitas(token);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo registrar la entrega",
      });
    }
  };

  const citasFiltradas = busquedaFecha
    ? citas.filter((cita) => fechaRecepcionISO(cita.fechaRecepcion) === busquedaFecha)
    : citas;

  const citasPendientesAdmin = citas.filter((c) => c.estado === "pendiente");
  const citasAdminOrdenadas = [...citas].sort((a, b) => {
    if (a.estado === "pendiente" && b.estado !== "pendiente") return -1;
    if (b.estado === "pendiente" && a.estado !== "pendiente") return 1;
    const fechaA = a.fechaPreferida ? new Date(a.fechaPreferida).getTime() : 0;
    const fechaB = b.fechaPreferida ? new Date(b.fechaPreferida).getTime() : 0;
    return fechaB - fechaA;
  });

  if (!token) {
    return <AuthMecanico onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Bike className="text-[#e8774a]" size={32} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {esAdmin ? "Panel de administración" : "Panel del mecánico"}
              </h1>
              <p className="text-gray-400">
                {esAdmin
                  ? "Citas de clientes, revisión de trabajos y configuración del taller"
                  : nombreUsuario
                    ? `Hola, ${nombreUsuario}`
                    : "Recepción, entrega y calendario"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Volver al sitio
            </Link>
            <button
              onClick={cerrarSesion}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>
        </div>

        {feedback && (
          <p
            className={`mb-6 text-sm ${feedback.type === "ok" ? "text-green-400" : "text-red-400"}`}
          >
            {feedback.text}
          </p>
        )}

        {esAdmin && whatsappEstado && (
          <div className="mb-8 bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="text-[#25D366]" size={20} />
              <h2 className="text-lg font-semibold">WhatsApp del taller</h2>
              {whatsappEstado.automaticoHabilitado && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    whatsappEstado.conectado
                      ? "bg-green-600/20 text-green-400"
                      : "bg-yellow-600/20 text-yellow-400"
                  }`}
                >
                  {whatsappEstado.conectado ? "Conectado" : "Pendiente de vincular"}
                </span>
              )}
            </div>
            {!whatsappEstado.automaticoHabilitado ? (
              <p className="text-sm text-gray-400">
                WhatsApp automático desactivado. Las confirmaciones y avisos se envían por correo
                electrónico cuando el cliente tiene email registrado.
              </p>
            ) : whatsappEstado.conectado ? (
              <p className="text-sm text-gray-400">
                {whatsappEstado.proveedor === "green-api"
                  ? "Envío automático activo vía Green API. Los avisos se envían al confirmar citas."
                  : "Los avisos de citas se envían automáticamente por WhatsApp al confirmarlas."}
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 leading-relaxed mb-3">
                    Escanea este código con el WhatsApp del taller (+57 314 490 2016) para
                    activar el envío automático. Ve a WhatsApp → Dispositivos vinculados →
                    Vincular dispositivo.
                  </p>
                  <p className="text-xs text-gray-500">
                    Solo debes hacerlo una vez. Mientras no esté vinculado, los avisos se envían
                    por correo si el cliente tiene email.
                  </p>
                </div>
                {whatsappEstado.qrDataUrl ? (
                  <img
                    src={whatsappEstado.qrDataUrl}
                    alt="Código QR de WhatsApp"
                    className="w-48 h-48 rounded-xl bg-white p-2 shrink-0"
                  />
                ) : (
                  <p className="text-sm text-gray-500">Generando código QR...</p>
                )}
              </div>
            )}
          </div>
        )}

        {esAdmin && (
          <div className="mb-8 bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Calendar className="text-[#e8774a]" size={20} />
              <h2 className="text-lg font-semibold">Citas de clientes</h2>
              {citasPendientesAdmin.length > 0 && (
                <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">
                  {citasPendientesAdmin.length} pendiente
                  {citasPendientesAdmin.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Las solicitudes llegan aquí en tiempo real. Solo lectura: un mecánico debe aceptar y
              gestionar cada cita en su panel.
            </p>
            {loading ? (
              <p className="text-gray-500 text-sm">Cargando citas...</p>
            ) : citasAdminOrdenadas.length === 0 ? (
              <p className="text-gray-500 text-sm">Aún no hay citas de clientes.</p>
            ) : (
              <div className="flex flex-col gap-3 max-h-[32rem] overflow-y-auto pr-1">
                {citasAdminOrdenadas.map((cita) => (
                  <div
                    key={cita.id}
                    className={`bg-[#262626] rounded-xl p-4 border ${
                      cita.estado === "pendiente" ? "border-yellow-600/40" : "border-transparent"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-medium">{cita.nombre}</p>
                        <p className="text-sm text-gray-400">{cita.telefono}</p>
                        {cita.email && <p className="text-sm text-gray-500">{cita.email}</p>}
                        {cita.servicio && (
                          <p className="text-[#e8774a] text-sm mt-1">{cita.servicio.titulo}</p>
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium shrink-0 ${ESTADO_COLOR[cita.estado] ?? "text-gray-400"}`}
                      >
                        {ESTADO_LABEL[cita.estado] ?? cita.estado}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div className="bg-[#1a1a1a] rounded-lg p-2.5">
                        <p className="text-gray-500 text-xs">Fecha solicitada</p>
                        <p>{formatearFechaHora(cita.fechaPreferida)}</p>
                      </div>
                      <div className="bg-[#1a1a1a] rounded-lg p-2.5">
                        <p className="text-gray-500 text-xs">Recepción en taller</p>
                        <p>{formatearFecha(cita.fechaRecepcion)}</p>
                      </div>
                      <div className="bg-[#1a1a1a] rounded-lg p-2.5">
                        <p className="text-gray-500 text-xs">Entrega</p>
                        <p>{formatearFecha(cita.fechaEntregaReal ?? cita.fechaEntrega)}</p>
                      </div>
                    </div>
                    {cita.mensaje?.trim() && (
                      <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                        <span className="text-gray-500">Nota del cliente: </span>
                        {cita.mensaje}
                      </p>
                    )}
                    {cita.estado === "pendiente" && (
                      <p className="text-xs text-yellow-500/90 mt-3">
                        Esperando que un mecánico acepte esta solicitud.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {esAdmin && (
          <div className="mb-8 bg-[#1a1a1a] border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <PackageCheck className="text-purple-400" size={20} />
              <h2 className="text-lg font-semibold">Motos en control de calidad</h2>
              {pendientesRevision.length > 0 && (
                <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                  {pendientesRevision.length}
                </span>
              )}
            </div>
            {pendientesRevision.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No hay motos en control de calidad pendientes de aprobar.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {pendientesRevision.map((pendiente) => (
                  <div key={pendiente.id} className="bg-[#262626] rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{pendiente.nombre}</p>
                        <p className="text-sm text-gray-400">{pendiente.telefono}</p>
                        <p className="text-sm text-gray-400">
                          Placa: {pendiente.placa ?? "—"} · Mecánico: {pendiente.mecanicoNombre}
                        </p>
                      </div>
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                        En calidad
                      </span>
                    </div>
                    {pendiente.descripcionTrabajo && (
                      <TrabajosDisplay descripcionTrabajo={pendiente.descripcionTrabajo} />
                    )}
                    <button
                      type="button"
                      onClick={() => avisarRetiroCliente(pendiente.id)}
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-full transition-colors w-full sm:w-fit"
                    >
                      <Send size={18} />
                      Avisar al cliente que puede retirar su moto
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {esAdmin && (
          <div className="mb-8 bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="text-[#e8774a]" size={20} />
              <h2 className="text-lg font-semibold">Solicitudes de registro</h2>
              {pendientes.length > 0 && (
                <span className="text-xs bg-[#e8774a] text-white px-2 py-0.5 rounded-full">
                  {pendientes.length}
                </span>
              )}
            </div>
            {pendientes.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay solicitudes pendientes.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {pendientes.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 bg-[#262626] rounded-xl p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {m.nombre} {m.apellidos}
                      </p>
                      <p className="text-sm text-gray-400">{m.email}</p>
                      <p className="text-sm text-gray-400">{m.celular}</p>
                      {m.direccion && (
                        <p className="text-sm text-gray-400">{m.direccion}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {TIPO_ID_LABEL[m.tipoIdentificacion] ?? m.tipoIdentificacion}:{" "}
                        {m.identificacion}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => aprobarMecanico(m.id)}
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                      >
                        <Check size={16} />
                        Aprobar
                      </button>
                      <button
                        onClick={() => rechazarMecanico(m.id)}
                        className="flex items-center gap-1.5 border border-red-500/50 text-red-400 hover:bg-red-500/10 text-sm px-4 py-2 rounded-lg transition-colors"
                      >
                        <X size={16} />
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {esAdmin && (
          <div className="mb-8 bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <History className="text-[#e8774a]" size={20} />
                <h2 className="text-lg font-semibold">Historial de trabajos</h2>
                {historialTrabajos.length > 0 && (
                  <span className="text-xs bg-[#e8774a] text-white px-2 py-0.5 rounded-full">
                    {historialTrabajos.length}
                  </span>
                )}
              </div>
              {mecanicosConTrabajos.length > 0 && (
                <select
                  value={filtroMecanico}
                  onChange={(e) => setFiltroMecanico(e.target.value)}
                  className="bg-[#262626] border border-[#333] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#e8774a]"
                >
                  <option value="">Todos los mecánicos</option>
                  {mecanicosConTrabajos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} ({m.totalTrabajos})
                    </option>
                  ))}
                </select>
              )}
            </div>
            {loadingAdmin ? (
              <p className="text-gray-500 text-sm">Cargando historial...</p>
            ) : historialTrabajos.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No hay trabajos registrados aún. Aparecerán cuando un mecánico finalice un trabajo.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {historialTrabajos.map((trabajo) => (
                  <div key={trabajo.id} className="bg-[#262626] rounded-xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-medium">{trabajo.clienteNombre}</p>
                        <p className="text-sm text-gray-400">{trabajo.telefono}</p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          trabajo.estado === "lista_retiro" || trabajo.estado === "entregada"
                            ? "bg-green-500/20 text-green-400"
                            : trabajo.estado === "finalizada"
                              ? "bg-purple-500/20 text-purple-400"
                            : trabajo.estado === "recibida"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {ESTADO_LABEL[trabajo.estado] ?? trabajo.estado}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                      <p>
                        <span className="text-gray-500">Mecánico: </span>
                        {trabajo.mecanicoNombre}
                      </p>
                      <p>
                        <span className="text-gray-500">Placa: </span>
                        {trabajo.placa ?? "—"}
                      </p>
                      <p>
                        <span className="text-gray-500">Recepción: </span>
                        {formatearFecha(trabajo.fechaRecepcion)}
                      </p>
                      <p>
                        <span className="text-gray-500">Entrega: </span>
                        {formatearFecha(trabajo.fechaEntregaReal)}
                      </p>
                    </div>
                    {trabajo.servicio && (
                      <p className="text-sm text-[#e8774a] mb-2">{trabajo.servicio}</p>
                    )}
                    {trabajo.estadoMotoIngreso && (
                      <div className="mb-2">
                        <p className="text-gray-500 text-xs mb-1">Estado al ingresar al taller</p>
                        <EstadoIngresoDisplay estadoMotoIngreso={trabajo.estadoMotoIngreso} />
                      </div>
                    )}
                    {trabajo.descripcionTrabajo && (
                      <TrabajosDisplay descripcionTrabajo={trabajo.descripcionTrabajo} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!esAdmin && (
          <>
        <div className="mb-6 bg-gradient-to-r from-[#e8774a]/20 to-amber-600/10 border border-[#e8774a]/40 rounded-2xl p-4 md:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-orange-300 flex items-center gap-2 mb-2 font-medium">
                <Search size={16} />
                Buscar por fecha de ingreso al taller
              </label>
              <input
                type="date"
                value={busquedaFecha}
                onChange={(e) => setBusquedaFecha(e.target.value)}
                className="w-full bg-[#1a1a1a] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#e8774a] border border-gray-700"
              />
            </div>
            {busquedaFecha && (
              <button
                type="button"
                onClick={() => setBusquedaFecha("")}
                className="flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors"
              >
                <X size={16} />
                Limpiar
              </button>
            )}
          </div>
          {busquedaFecha && (
            <p className="text-xs text-gray-400 mt-3">
              Mostrando motos que ingresaron el{" "}
              {new Date(`${busquedaFecha}T12:00:00`).toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              ({citasFiltradas.length} resultado{citasFiltradas.length !== 1 ? "s" : ""})
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-gray-400">Cargando citas...</p>
        ) : citas.length === 0 ? (
          <p className="text-gray-400">No hay citas registradas.</p>
        ) : citasFiltradas.length === 0 ? (
          <p className="text-gray-400">No hay motos ingresadas en esa fecha.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {citasFiltradas.map((cita) => (
              <div key={cita.id} className="bg-[#1a1a1a] rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{cita.nombre}</h2>
                    <p className="text-gray-400 text-sm">{cita.telefono}</p>
                    {cita.servicio && (
                      <p className="text-[#e8774a] text-sm mt-1">{cita.servicio.titulo}</p>
                    )}
                  </div>
                  <span className={`font-medium ${ESTADO_COLOR[cita.estado] ?? "text-gray-400"}`}>
                    {ESTADO_LABEL[cita.estado] ?? cita.estado}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-[#262626] rounded-xl p-3">
                    <p className="text-gray-400">Cita solicitada</p>
                    <p>{formatearFechaHora(cita.fechaPreferida)}</p>
                  </div>
                  <div className="bg-[#262626] rounded-xl p-3">
                    <p className="text-gray-400">Recepción</p>
                    <p>{formatearFecha(cita.fechaRecepcion)}</p>
                  </div>
                  <div className="bg-[#262626] rounded-xl p-3">
                    <p className="text-gray-400">Entrega real</p>
                    <p>{formatearFecha(cita.fechaEntregaReal)}</p>
                  </div>
                </div>

                {(cita.estadoMotoIngreso || cita.datosReparacionBloqueados || cita.placa) && (
                  <div className="bg-[#262626] rounded-xl p-4 flex flex-col gap-3 border border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Lock size={14} />
                      Datos de la moto (solo lectura)
                    </div>
                    {cita.estadoMotoIngreso && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Estado de la moto al ingresar al taller
                        </p>
                        <EstadoIngresoDisplay estadoMotoIngreso={cita.estadoMotoIngreso} />
                      </div>
                    )}
                    {cita.placa ? (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Placa</p>
                          <input
                            readOnly
                            disabled
                            value={cita.placa}
                            className="w-full bg-[#1a1a1a] rounded-lg px-3 py-2 text-white opacity-80 cursor-not-allowed uppercase"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Trabajos realizados</p>
                          <TrabajosDisplay descripcionTrabajo={cita.descripcionTrabajo} />
                        </div>
                      </>
                    ) : cita.datosReparacionBloqueados ? (
                      <p className="text-sm text-gray-500">
                        Datos de entrega registrados por otro usuario. Solo un administrador puede
                        verlos.
                      </p>
                    ) : null}
                  </div>
                )}

                {cita.estado === "pendiente" && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-gray-400 leading-relaxed">
                      El cliente solicitó esta cita. Al aceptarla, se le enviará un aviso
                      automático por correo y/o WhatsApp.
                    </p>
                    <button
                      type="button"
                      onClick={() => confirmarCita(cita)}
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-full transition-colors w-full sm:w-fit"
                    >
                      <Check size={18} />
                      Aceptar cita y notificar al cliente
                    </button>
                  </div>
                )}

                {cita.estado === "confirmada" && (
                  <div className="flex flex-col gap-3">
                    {!recepcionAbierta[cita.id] ? (
                      <>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          Cita confirmada. Cuando la moto llegue físicamente al taller, registra
                          aquí su ingreso.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => reenviarConfirmacion(cita)}
                            className="flex items-center justify-center gap-2 border border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366]/10 font-medium py-2 px-4 rounded-full transition-colors text-sm"
                          >
                            <MessageCircle size={16} />
                            Reenviar confirmación por WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirRecepcion(cita.id)}
                            className="flex items-center justify-center gap-2 bg-[#e8774a] hover:bg-[#d4693e] text-white font-semibold py-2.5 px-4 rounded-full transition-colors w-full sm:w-fit"
                          >
                            <PackageOpen size={18} />
                            La moto llegó — Registrar recepción
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-[#e8774a] font-medium">
                          Registro de ingreso al taller
                        </p>
                        <div>
                          <label className="text-sm text-gray-400 mb-1 block">
                            Estado de la moto al ingresar al taller{" "}
                            <span className="text-[#e8774a]">*</span>
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Ej: Rayón en el tanque, llanta trasera desgastada, fuga de aceite leve..."
                            value={obtenerRecepcionForm(cita.id).descripcion}
                            onChange={(e) =>
                              actualizarDescripcionRecepcion(cita.id, e.target.value)
                            }
                            className="w-full bg-[#262626] rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#e8774a] resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Registro fotográfico y en video <span className="text-[#e8774a]">*</span>
                          </label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <label className="flex items-center gap-2 bg-[#262626] hover:bg-[#333] border border-[#444] rounded-xl px-4 py-2.5 cursor-pointer transition-colors text-sm text-gray-300">
                              <Camera size={16} className="text-[#e8774a]" />
                              Agregar foto
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) agregarMedioRecepcion(cita.id, file, "foto");
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            <label className="flex items-center gap-2 bg-[#262626] hover:bg-[#333] border border-[#444] rounded-xl px-4 py-2.5 cursor-pointer transition-colors text-sm text-gray-300">
                              <Video size={16} className="text-[#e8774a]" />
                              Agregar video
                              <input
                                type="file"
                                accept="video/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) agregarMedioRecepcion(cita.id, file, "video");
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                          {obtenerRecepcionForm(cita.id).medios.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {obtenerRecepcionForm(cita.id).medios.map((medio, index) => (
                                <div
                                  key={`${medio.tipo}-${index}`}
                                  className="relative bg-[#262626] rounded-xl p-2 border border-[#333]"
                                >
                                  <button
                                    type="button"
                                    onClick={() => quitarMedioRecepcion(cita.id, index)}
                                    className="absolute top-2 right-2 z-10 bg-black/70 rounded-full p-1 text-gray-300 hover:text-red-400"
                                    aria-label="Quitar archivo"
                                  >
                                    <X size={14} />
                                  </button>
                                  {medio.tipo === "foto" ? (
                                    <img
                                      src={medio.preview}
                                      alt={`Foto ingreso ${index + 1}`}
                                      className="rounded-lg w-full max-h-48 object-cover"
                                    />
                                  ) : (
                                    <video
                                      src={medio.preview}
                                      controls
                                      playsInline
                                      className="rounded-lg w-full max-h-48 bg-black"
                                    />
                                  )}
                                  <p className="text-xs text-gray-500 mt-1.5 text-center capitalize">
                                    {medio.tipo}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => recibirMoto(cita)}
                            className="flex items-center justify-center gap-2 bg-[#e8774a] hover:bg-[#d4693e] text-white font-semibold py-2.5 px-4 rounded-full transition-colors"
                          >
                            <PackageOpen size={18} />
                            Confirmar recepción
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelarRecepcion(cita.id)}
                            className="flex items-center justify-center gap-2 border border-[#444] text-gray-400 hover:text-white py-2.5 px-4 rounded-full transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Al confirmar se bloquean los días del calendario. La placa y los trabajos
                          se registran al entregar la moto.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {cita.estado === "recibida" && (
                  <div className="flex flex-col gap-3">
                    {cita.estadoMotoIngreso && (
                      <div className="bg-[#262626] rounded-xl p-4 border border-[#333]">
                        <p className="text-xs text-gray-500 mb-2">
                          Estado de la moto al ingresar al taller
                        </p>
                        <EstadoIngresoDisplay estadoMotoIngreso={cita.estadoMotoIngreso} />
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">
                        Placa de la moto <span className="text-[#e8774a]">*</span>
                      </label>
                      <input
                        required
                        placeholder="Ej: ABC123"
                        value={obtenerEntregaForm(cita.id).placa}
                        onChange={(e) => actualizarPlaca(cita.id, e.target.value)}
                        className="w-full bg-[#262626] rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#e8774a] uppercase"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <label className="text-sm text-gray-400 block">
                          Trabajos realizados <span className="text-[#e8774a]">*</span>
                        </label>
                        {borradorEstado[cita.id] === "guardando" && (
                          <span className="text-xs text-blue-400">Guardando para el cliente...</span>
                        )}
                        {borradorEstado[cita.id] === "guardado" && (
                          <span className="text-xs text-green-400">Visible para el cliente</span>
                        )}
                        {borradorEstado[cita.id] === "error" && (
                          <span className="text-xs text-red-400">No se pudo guardar el avance</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Lo que escribas y las fotos que subas se muestran al cliente en vivo, antes de
                        finalizar.
                      </p>
                      <div className="flex flex-col gap-3">
                        {obtenerEntregaForm(cita.id).trabajos.map((trabajo, index) => (
                          <div
                            key={index}
                            className="bg-[#262626] rounded-xl p-4 flex flex-col gap-3 border border-[#333]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Trabajo {index + 1}
                              </p>
                              {obtenerEntregaForm(cita.id).trabajos.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => quitarTrabajo(cita.id, index)}
                                  className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                  aria-label="Quitar trabajo"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">
                                Pieza o componente
                              </label>
                              <input
                                placeholder="Ej: Llantas"
                                value={trabajo.parte}
                                onChange={(e) =>
                                  actualizarTrabajo(cita.id, index, "parte", e.target.value)
                                }
                                className="w-full bg-[#1a1a1a] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#e8774a]"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">
                                Qué se le hizo
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Ej: Cambio y balanceo"
                                value={trabajo.descripcion}
                                onChange={(e) =>
                                  actualizarTrabajo(cita.id, index, "descripcion", e.target.value)
                                }
                                className="w-full bg-[#1a1a1a] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#e8774a] resize-none"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">
                                Registro fotográfico <span className="text-[#e8774a]">*</span>
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                Obligatorio: al menos una foto en cada columna.
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(["viejo", "nuevo"] as const).map((tipo) => {
                                  const esViejo = tipo === "viejo";
                                  const titulo = esViejo ? "Repuestos viejos" : "Repuestos nuevos";
                                  const fotos = esViejo ? trabajo.fotosViejos : trabajo.fotosNuevos;
                                  const columnaVacia =
                                    fotosObligatoriasError[cita.id] && fotos.length === 0;

                                  return (
                                    <div
                                      key={tipo}
                                      className={`bg-[#1a1a1a] rounded-lg p-3 border flex flex-col gap-2 ${
                                        columnaVacia
                                          ? "border-red-500/80"
                                          : "border-[#333]"
                                      }`}
                                    >
                                      <p className="text-xs text-gray-400 font-medium">
                                        {titulo} <span className="text-[#e8774a]">*</span>
                                      </p>
                                      <label className="flex items-center justify-center gap-2 w-full border border-dashed border-[#444] hover:border-[#e8774a] rounded-lg px-3 py-2.5 cursor-pointer transition-colors text-xs text-gray-400">
                                        <Camera size={16} />
                                        Agregar foto
                                        <input
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          multiple
                                          className="hidden"
                                          onChange={(e) => {
                                            const archivos = Array.from(e.target.files ?? []);
                                            archivos.forEach((file) =>
                                              agregarFotoTrabajo(cita.id, index, tipo, file),
                                            );
                                            e.target.value = "";
                                          }}
                                        />
                                      </label>
                                      {fotos.length > 0 && (
                                        <div className="flex flex-col gap-2">
                                          {fotos.map((foto, fotoIndex) => (
                                            <div key={foto.id} className="relative">
                                              {fotos.length > 0 && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    quitarFotoTrabajo(
                                                      cita.id,
                                                      index,
                                                      tipo,
                                                      fotoIndex,
                                                    )
                                                  }
                                                  className="absolute top-2 right-2 z-10 bg-black/70 rounded-full p-1 text-gray-300 hover:text-red-400"
                                                  aria-label="Quitar foto"
                                                >
                                                  <X size={14} />
                                                </button>
                                              )}
                                              {(foto.preview ?? foto.url) && (
                                                <img
                                                  src={foto.preview ?? foto.url ?? ""}
                                                  alt={`${titulo} ${fotoIndex + 1}`}
                                                  className="rounded-lg w-full max-h-40 object-cover border border-[#333]"
                                                />
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => agregarTrabajo(cita.id)}
                          className="flex items-center justify-center gap-2 w-full border border-dashed border-[#444] hover:border-[#e8774a] text-gray-400 hover:text-[#e8774a] py-2.5 rounded-xl transition-colors text-sm"
                        >
                          <Plus size={16} />
                          Agregar otro trabajo
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="text-sm text-gray-400 flex items-center gap-1 mb-1">
                          <Calendar size={14} />
                          Fecha de entrega
                        </label>
                        <input
                          type="date"
                          value={fechasEntrega[cita.id] ?? hoyISO()}
                          onChange={(e) =>
                            setFechasEntrega((prev) => ({ ...prev, [cita.id]: e.target.value }))
                          }
                          className="bg-[#262626] rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#e8774a]"
                        />
                      </div>
                      <button
                        onClick={() => finalizarMoto(cita)}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-full transition-colors"
                      >
                        <PackageCheck size={18} />
                        Finalizar trabajo
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Al finalizar, el cliente recibirá un aviso de que su moto está en control de
                      calidad. El administrador la revisará y avisará cuando pueda retirarla.
                    </p>
                  </div>
                )}

                {cita.estado === "finalizada" && (
                  <p className="text-sm text-purple-300">
                    En control de calidad. El cliente ya fue avisado. El administrador confirmará
                    cuando pueda retirar la moto.
                  </p>
                )}

                {cita.estado === "lista_retiro" && (
                  <div className="flex flex-col gap-3 border border-green-600/40 bg-green-950/20 rounded-xl p-4">
                    <p className="text-sm font-medium text-green-400">Entrega</p>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      El cliente ya fue avisado y puede pasar por su moto. Cuando llegue
                      físicamente al taller, registra la entrega.
                    </p>
                    <button
                      type="button"
                      onClick={() => entregarMotoCliente(cita)}
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-full transition-colors w-full sm:w-fit"
                    >
                      <PackageCheck size={18} />
                      Cliente llegó — Entregar moto
                    </button>
                  </div>
                )}

                {cita.estado === "entregada" && (
                  <p className="text-sm text-green-400">
                    Moto entregada al cliente. Proceso completado.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
