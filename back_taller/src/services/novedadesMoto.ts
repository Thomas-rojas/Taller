export type TipoNovedad = "noticia" | "lanzamiento" | "tip";

export type NovedadMoto = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string | null;
  tipo: TipoNovedad;
  url: string | null;
  fuente: string | null;
  createdAt: string;
};

const CACHE_RSS_MS = 5 * 60 * 1000;
const SLOT_ROTACION_MS = 90 * 1000;

const FEEDS = [
  {
    url: "https://news.google.com/rss/search?q=motocicletas+moto&hl=es-419&gl=CO&ceid=CO:es-419",
    fuente: "Google Noticias",
  },
  {
    url: "https://news.google.com/rss/search?q=lanzamiento+nueva+motocicleta&hl=es-419&gl=CO&ceid=CO:es-419",
    fuente: "Lanzamientos",
  },
];

const PALABRAS_LANZAMIENTO =
  /\b(lanzamiento|lanza|nueva|nuevo|presenta|debut|estrena|2025|2026|revela|unveil)\b/i;

type CacheNovedades = {
  noticias: NovedadMoto[];
  lanzamientos: NovedadMoto[];
  fetchedAt: number;
};

let cache: CacheNovedades | null = null;

function limpiarHtml(texto: string) {
  return texto
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extraerTag(bloque: string, tag: string) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = bloque.match(regex);
  return match ? match[1] : "";
}

function extraerImagenRss(bloque: string, descripcionRaw: string): string | null {
  const media = bloque.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (media?.[1]) return media[1];

  const enclosure = bloque.match(
    /<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image[^"']*["']/i,
  );
  if (enclosure?.[1]) return enclosure[1];

  const img = descripcionRaw.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (img?.[1]) return img[1];

  return null;
}

function esUrlImagenValida(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Fotos de motos (Unsplash) — distintas por categoría, no las del taller */
const IMAGENES_NOTICIA = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=480&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=480&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=480&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=480&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503234217566-56b2935bfb45?w=480&q=80&auto=format&fit=crop",
];

const IMAGENES_LANZAMIENTO = [
  "https://images.unsplash.com/photo-1609630875171-b132169807cc?w=480&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1591637373688-368f427fc7e5?w=480&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=480&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1525168548854-1cf859b31cde?w=480&q=80&auto=format&fit=crop",
];

const IMAGENES_TIP: Record<string, string> = {
  lluvia: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=480&q=80&auto=format&fit=crop",
  calor: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=480&q=80&auto=format&fit=crop",
  ciudad: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=480&q=80&auto=format&fit=crop",
  viaje: "https://images.unsplash.com/photo-1504893527213-7f7beb5ba13d?w=480&q=80&auto=format&fit=crop",
  inactiva: "https://images.unsplash.com/photo-1622185131045-ee2e9e9e8d1f?w=480&q=80&auto=format&fit=crop",
  "post-servicio": "https://images.unsplash.com/photo-1486262715619-67b85e443608?w=480&q=80&auto=format&fit=crop",
  mantenimiento: "https://images.unsplash.com/photo-1632823471565-1ecdf763bd9a?w=480&q=80&auto=format&fit=crop",
};

function hashTitulo(titulo: string) {
  return titulo.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function imagenPorTipo(tipo: TipoNovedad, titulo: string, index: number, imagenRss?: string | null) {
  if (imagenRss && esUrlImagenValida(imagenRss)) return imagenRss;
  const hash = hashTitulo(titulo);
  if (tipo === "lanzamiento") {
    return IMAGENES_LANZAMIENTO[(hash + index) % IMAGENES_LANZAMIENTO.length];
  }
  return IMAGENES_NOTICIA[(hash + index) % IMAGENES_NOTICIA.length];
}

function parsearRss(xml: string, fuenteDefault: string) {
  const items: {
    titulo: string;
    descripcion: string;
    url: string;
    fecha: Date;
    fuente: string;
    imagen: string | null;
  }[] = [];

  const bloques = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const bloque of bloques) {
    const titulo = limpiarHtml(extraerTag(bloque, "title"));
    const descripcionRaw = extraerTag(bloque, "description");
    const descripcion = limpiarHtml(descripcionRaw) || titulo;
    const url = limpiarHtml(extraerTag(bloque, "link"));
    const pubDate = extraerTag(bloque, "pubDate");
    if (!titulo) continue;

    items.push({
      titulo,
      descripcion,
      url: url || "",
      fecha: pubDate ? new Date(pubDate) : new Date(),
      fuente: fuenteDefault,
      imagen: extraerImagenRss(bloque, descripcionRaw),
    });
  }

  return items;
}

async function obtenerFeed(url: string, fuente: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "MotoTallerFamiliar/1.0 (RSS reader)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return [];
    const xml = await response.text();
    return parsearRss(xml, fuente);
  } catch {
    return [];
  }
}

type TipContextual = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  momento: string;
};

const TIPS_CUIDADO: TipContextual[] = [
  {
    id: "tip-lluvia-1",
    titulo: "Lluvia: cadena y frenos",
    descripcion:
      "Después de rodar bajo lluvia, seca la cadena y lubrica. Revisa que los frenos respondan antes de acelerar.",
    imagen: IMAGENES_TIP.lluvia,
    momento: "lluvia",
  },
  {
    id: "tip-lluvia-2",
    titulo: "Visibilidad en aguacero",
    descripcion:
      "Limpia el visor con producto antivaho y usa ropa reflectiva. Reduce velocidad en curvas mojadas.",
    imagen: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=480&q=80&auto=format&fit=crop",
    momento: "lluvia",
  },
  {
    id: "tip-calor-1",
    titulo: "Calor: refrigeración del motor",
    descripcion:
      "En días calurosos revisa el nivel de refrigerante o aceite. Evita encierros prolongados con el motor caliente.",
    imagen: IMAGENES_TIP.calor,
    momento: "calor",
  },
  {
    id: "tip-calor-2",
    titulo: "Hidrátate y protege el motor",
    descripcion:
      "Haz pausas en viajes largos bajo el sol. Un motor sobrecalentado pierde rendimiento y vida útil.",
    imagen: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=480&q=80&auto=format&fit=crop",
    momento: "calor",
  },
  {
    id: "tip-ciudad-1",
    titulo: "Uso diario en ciudad",
    descripcion:
      "Revisa neumáticos cada 2 semanas. El tráfico urbano desgasta frenos y embrague más rápido.",
    imagen: IMAGENES_TIP.ciudad,
    momento: "ciudad",
  },
  {
    id: "tip-ciudad-2",
    titulo: "Arranques y paradas",
    descripcion:
      "Calienta el motor 1–2 minutos antes de exigirlo. Evita acelerones bruscos en semáforos.",
    imagen: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=480&q=80&auto=format&fit=crop",
    momento: "ciudad",
  },
  {
    id: "tip-viaje-1",
    titulo: "Antes de un viaje largo",
    descripcion:
      "Verifica presión de llantas, luces, cadena y líquido de frenos. Lleva kit básico y documentos al día.",
    imagen: IMAGENES_TIP.viaje,
    momento: "viaje",
  },
  {
    id: "tip-viaje-2",
    titulo: "En carretera",
    descripcion:
      "Mantén distancia de seguridad y revisa el desgaste del neumático trasero cada parada de descanso.",
    imagen: "https://images.unsplash.com/photo-1504893527213-7f7beb5ba13d?w=480&q=80&auto=format&fit=crop",
    momento: "viaje",
  },
  {
    id: "tip-inactiva-1",
    titulo: "Moto sin usar varios días",
    descripcion:
      "Arranca el motor cada 5–7 días. Si la dejas mucho tiempo, usa estabilizador de combustible.",
    imagen: IMAGENES_TIP.inactiva,
    momento: "inactiva",
  },
  {
    id: "tip-inactiva-2",
    titulo: "Batería en reposo",
    descripcion:
      "Desconecta el borne negativo si no la usarás más de 2 semanas, o carga la batería periódicamente.",
    imagen: "https://images.unsplash.com/photo-1622185131045-ee2e9e9e8d1f?w=480&q=80&auto=format&fit=crop",
    momento: "inactiva",
  },
  {
    id: "tip-post-1",
    titulo: "Después del taller",
    descripcion:
      "Rodar suave las primeras 50 km tras un servicio mayor. Así los componentes nuevos se asientan bien.",
    imagen: IMAGENES_TIP["post-servicio"],
    momento: "post-servicio",
  },
  {
    id: "tip-aceite-1",
    titulo: "Cambio de aceite a tiempo",
    descripcion:
      "Respeta el intervalo del fabricante. Un aceite viejo acorta la vida del motor y sube el consumo.",
    imagen: IMAGENES_TIP.mantenimiento,
    momento: "mantenimiento",
  },
  {
    id: "tip-frenos-1",
    titulo: "Frenos siempre listos",
    descripcion:
      "Si el freno se siente esponjoso o chirria, revisa de inmediato. El 70% de emergencias dependen de ellos.",
    imagen: "https://images.unsplash.com/photo-1632823471565-1ecdf763bd9a?w=480&q=80&auto=format&fit=crop",
    momento: "mantenimiento",
  },
];

function momentosActuales(fecha = new Date()) {
  const mes = fecha.getMonth() + 1;
  const momentos = new Set<string>(["ciudad", "mantenimiento"]);

  if ([4, 5, 10, 11].includes(mes)) {
    momentos.add("lluvia");
  } else {
    momentos.add("calor");
  }

  const dia = fecha.getDate();
  if (dia % 2 === 0) momentos.add("viaje");
  if (dia % 3 === 0) momentos.add("inactiva");
  momentos.add("post-servicio");

  return momentos;
}

function slotRotacion(fecha = new Date()) {
  return Math.floor(fecha.getTime() / SLOT_ROTACION_MS);
}

function rotarLista<T>(items: T[], slot: number, cantidad: number): T[] {
  if (items.length === 0) return [];
  const inicio = slot % items.length;
  const resultado: T[] = [];
  for (let i = 0; i < Math.min(cantidad, items.length); i++) {
    resultado.push(items[(inicio + i) % items.length]);
  }
  return resultado;
}

function mezclarNovedades(
  tips: NovedadMoto[],
  lanzamientos: NovedadMoto[],
  noticias: NovedadMoto[],
  slot: number,
): NovedadMoto[] {
  const grupos = [tips, lanzamientos, noticias].filter((g) => g.length > 0);
  const mezclado: NovedadMoto[] = [];
  const maxLen = Math.max(...grupos.map((g) => g.length), 0);

  for (let i = 0; i < maxLen; i++) {
    for (let g = 0; g < grupos.length; g++) {
      const idx = (i + slot + g) % grupos[g].length;
      const item = grupos[g][idx];
      if (!mezclado.some((x) => x.id === item.id)) {
        mezclado.push(item);
      }
    }
  }

  return mezclado.slice(0, 9);
}

function tipsParaMomento(fecha = new Date()): NovedadMoto[] {
  const momentos = momentosActuales(fecha);
  const slot = slotRotacion(fecha);
  const relevantes = TIPS_CUIDADO.filter((t) => momentos.has(t.momento));
  const pool = relevantes.length >= 4 ? relevantes : TIPS_CUIDADO;

  const rotados = [...pool].sort(
    (a, b) =>
      ((slot + hashTitulo(a.id)) % pool.length) -
      ((slot + hashTitulo(b.id)) % pool.length),
  );

  const cantidad = 2 + (slot % 3);
  return rotados.slice(0, cantidad).map((tip) => ({
    id: `${tip.id}-s${slot}`,
    titulo: tip.titulo,
    descripcion: tip.descripcion,
    imagen: tip.imagen,
    tipo: "tip" as const,
    url: null,
    fuente: "Moto Taller · Consejo actualizado",
    createdAt: fecha.toISOString(),
  }));
}

function aNovedad(
  item: {
    titulo: string;
    descripcion: string;
    url: string;
    fecha: Date;
    fuente: string;
    imagen: string | null;
  },
  index: number,
  forzarTipo?: TipoNovedad,
): NovedadMoto {
  const esLanzamiento =
    forzarTipo === "lanzamiento" ||
    (forzarTipo !== "noticia" && PALABRAS_LANZAMIENTO.test(item.titulo));

  const tipo: TipoNovedad = esLanzamiento ? "lanzamiento" : "noticia";

  return {
    id: `rss-${index}-${item.titulo.toLowerCase().replace(/\W+/g, "-").slice(0, 40)}`,
    titulo: item.titulo.slice(0, 120),
    descripcion: item.descripcion.slice(0, 220),
    imagen: imagenPorTipo(tipo, item.titulo, index, item.imagen),
    tipo,
    url: item.url || null,
    fuente: item.fuente,
    createdAt: item.fecha.toISOString(),
  };
}

const FALLBACK_NOTICIAS: NovedadMoto[] = [
  {
    id: "fallback-noticia-1",
    titulo: "Tendencias del mercado motero en Colombia",
    descripcion:
      "Las motos de baja cilindrada siguen liderando ventas por su economía y facilidad en ciudad.",
    imagen: IMAGENES_NOTICIA[0],
    tipo: "noticia",
    url: null,
    fuente: "Moto Taller",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-lanzamiento-1",
    titulo: "Nuevos modelos eléctricos y de aventura",
    descripcion:
      "Varias marcas presentan lanzamientos con más autonomía y asistencia electrónica este año.",
    imagen: IMAGENES_LANZAMIENTO[0],
    tipo: "lanzamiento",
    url: null,
    fuente: "Moto Taller",
    createdAt: new Date().toISOString(),
  },
];

export async function obtenerNovedadesMoto(): Promise<NovedadMoto[]> {
  const ahora = Date.now();
  const slot = slotRotacion();

  if (!cache || ahora - cache.fetchedAt >= CACHE_RSS_MS) {
    const resultadosFeed = await Promise.all(
      FEEDS.map((feed) => obtenerFeed(feed.url, feed.fuente)),
    );

    const todosItems = resultadosFeed.flat();
    const vistos = new Set<string>();

    const noticias: NovedadMoto[] = [];
    const lanzamientos: NovedadMoto[] = [];

    for (const [index, item] of todosItems.entries()) {
      const clave = item.titulo.toLowerCase().slice(0, 60);
      if (vistos.has(clave)) continue;
      vistos.add(clave);

      const novedad = aNovedad(
        item,
        index,
        item.fuente === "Lanzamientos" ? "lanzamiento" : undefined,
      );

      if (novedad.tipo === "lanzamiento") {
        if (lanzamientos.length < 12) lanzamientos.push(novedad);
      } else if (noticias.length < 15) {
        noticias.push(novedad);
      }
    }

    if (noticias.length === 0) noticias.push(FALLBACK_NOTICIAS[0]);
    if (lanzamientos.length === 0) lanzamientos.push(FALLBACK_NOTICIAS[1]);

    cache = { noticias, lanzamientos, fetchedAt: ahora };
  }

  const tips = tipsParaMomento();
  const lanzamientos = rotarLista(cache.lanzamientos, slot, 2 + (slot % 2));
  const noticias = rotarLista(cache.noticias, slot + 1, 2 + (slot % 3));

  return mezclarNovedades(tips, lanzamientos, noticias, slot);
}

export function invalidarCacheNovedades() {
  cache = null;
}
