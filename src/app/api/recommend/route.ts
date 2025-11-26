import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type UserPreferences = {
  tripType?: string;
  budget?: string;
  climate?: string;
  duration?: string;
  activities?: string[];
  lodging?: string;
  company?: string;
  season?: string;
};

type Destination = {
  id: number;
  name: string;
  country: string;
  primaryType: string;
  secondaryTypes: string[];
  climate: string;
  priceRange: string;
  availableActivities: string[];
  recommendedFor: string[];
  coordinates: { lat: number; lon: number };
  description?: string;
};

const mockDestinations: Destination[] = [
  {
    id: 1,
    name: "Cusco",
    country: "Perú",
    primaryType: "cultural",
    secondaryTypes: ["adventure", "nature"],
    climate: "temperate",
    priceRange: "moderate",
    availableActivities: ["history", "trekking", "gastronomy"],
    recommendedFor: ["couple", "friends", "solo"],
    coordinates: { lat: -13.5319, lon: -71.9675 },
    description: "Capital histórica de los Incas y puerta de entrada a Machu Picchu.",
  },
  {
    id: 2,
    name: "Cancún",
    country: "México",
    primaryType: "relax",
    secondaryTypes: ["romantic", "nightlife"],
    climate: "warm",
    priceRange: "comfort",
    availableActivities: ["nature", "nightlife", "gastronomy", "shopping"],
    recommendedFor: ["couple", "friends", "group"],
    coordinates: { lat: 21.1619, lon: -86.8515 },
    description: "Playas de arena blanca y aguas turquesa en el Caribe mexicano.",
  },
  {
    id: 3,
    name: "Bariloche",
    country: "Argentina",
    primaryType: "adventure",
    secondaryTypes: ["nature", "family"],
    climate: "cold",
    priceRange: "moderate",
    availableActivities: ["nature", "extreme", "gastronomy"],
    recommendedFor: ["family_kids", "friends"],
    coordinates: { lat: -41.1335, lon: -71.3103 },
    description: "Lagos, bosques y montañas en la Patagonia; ideal para esquí y trekking.",
  },
  {
    id: 4,
    name: "Cartagena",
    country: "Colombia",
    primaryType: "cultural",
    secondaryTypes: ["relax", "romantic"],
    climate: "warm",
    priceRange: "moderate",
    availableActivities: ["history", "gastronomy", "nightlife"],
    recommendedFor: ["couple", "friends"],
    coordinates: { lat: 10.391, lon: -75.4794 },
    description: "Ciudad amurallada con arquitectura colonial y vibrante vida caribeña.",
  },
  {
    id: 5,
    name: "Cusco",
    country: "Perú",
    primaryType: "cultural",
    secondaryTypes: ["adventure", "nature"],
    climate: "temperate",
    priceRange: "moderate",
    availableActivities: ["history", "trekking", "gastronomy"],
    recommendedFor: ["couple", "friends", "solo"],
    coordinates: { lat: -13.5319, lon: -71.9675 },
    description: "Capital histórica de los Incas y puerta de entrada a Machu Picchu.",
  },
  {
    id: 6,
    name: "Madrid",
    country: "España",
    primaryType: "cultural",
    secondaryTypes: ["gastronomic", "nightlife"],
    climate: "temperate",
    priceRange: "comfort",
    availableActivities: ["history", "shopping", "gastronomy", "nightlife"],
    recommendedFor: ["solo", "friends", "couple"],
    coordinates: { lat: 40.4168, lon: -3.7038 },
    description: "Capital vibrante con museos, gastronomía y vida nocturna.",
  },
  {
    id: 7,
    name: "Tulum",
    country: "México",
    primaryType: "ecotourism",
    secondaryTypes: ["relax", "romantic"],
    climate: "warm",
    priceRange: "comfort",
    availableActivities: ["nature", "history", "gastronomy"],
    recommendedFor: ["couple", "solo"],
    coordinates: { lat: 20.211, lon: -87.4653 },
    description: "Playas, cenotes y ruinas mayas en un entorno natural.",
  },
  {
    id: 8,
    name: "Quito",
    country: "Ecuador",
    primaryType: "cultural",
    secondaryTypes: ["nature", "adventure"],
    climate: "temperate",
    priceRange: "economic",
    availableActivities: ["history", "nature", "gastronomy"],
    recommendedFor: ["family_kids", "friends"],
    coordinates: { lat: -0.1807, lon: -78.4678 },
    description: "Centro histórico colonial y acceso a volcanes y naturaleza andina.",
  },
  {
    id: 9,
    name: "Machu Picchu",
    country: "Perú",
    primaryType: "adventure",
    secondaryTypes: ["nature", "cultural"],
    climate: "temperate",
    priceRange: "moderate",
    availableActivities: ["trekking", "history", "nature"],
    recommendedFor: ["friends", "solo"],
    coordinates: { lat: -13.1631, lon: -72.545 },
    description: "Ciudadela inca entre montañas, ideal para trekking y cultura.",
  },
  {
    id: 10,
    name: "Buenos Aires",
    country: "Argentina",
    primaryType: "cultural",
    secondaryTypes: ["nightlife", "gastronomic"],
    climate: "temperate",
    priceRange: "moderate",
    availableActivities: ["history", "nightlife", "gastronomy", "shopping"],
    recommendedFor: ["friends", "couple", "solo"],
    coordinates: { lat: -34.6037, lon: -58.3816 },
    description: "Capital cosmopolita con tango, cafés y arquitectura europea.",
  },
];

type Rules = {
  weights: Record<string, number>;
  budgetOrder: string[];
  defaults: Record<string, number>;
};

// Dominios permitidos por Next/Image para asegurar que las imágenes carguen correctamente
const ALLOWED_IMAGE_HOSTS = new Set([
  "images.unsplash.com",
  "plus.unsplash.com",
  "images.pexels.com",
  "pixabay.com",
  "cdn.pixabay.com",
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "images.opentripmap.com",
  // Fuentes típicas de imágenes de hoteles
  "cf.bstatic.com", // Booking
  "media-cdn.tripadvisor.com",
  "dynamic-media-cdn.tripadvisor.com",
  "images.trvl-media.com", // Expedia/Hotels.com
]);

function filterAllowedImages(urls: string[]): string[] {
  const out: string[] = [];
  for (const u of urls) {
    if (typeof u !== "string") continue;
    try {
      const host = new URL(u).hostname.toLowerCase();
      if (ALLOWED_IMAGE_HOSTS.has(host)) out.push(u);
    } catch {}
  }
  return out;
}

let cachedDB: Destination[] | null = null;
let cachedRules: Rules | null = null;

async function loadConfig(): Promise<{ db: Destination[]; rules: Rules }> {
  if (cachedDB && cachedRules) return { db: cachedDB, rules: cachedRules };
  try {
    const dbPath = path.join(process.cwd(), "config", "destinations-database.json");
    const rulesPath = path.join(process.cwd(), "config", "destinations-rules.json");
    const [dbRaw, rulesRaw] = await Promise.all([
      fs.readFile(dbPath, "utf-8"),
      fs.readFile(rulesPath, "utf-8"),
    ]);
    const dbParsed = JSON.parse(dbRaw) as Destination[];
    const rulesParsed = JSON.parse(rulesRaw) as Rules;
    cachedDB = dbParsed;
    cachedRules = rulesParsed;
    return { db: dbParsed, rules: rulesParsed };
  } catch (e) {
    console.warn("No se pudo cargar config/, usando mock embebido:", e);
    // Fallback a los mocks embebidos y reglas por defecto
    cachedDB = mockDestinations;
    cachedRules = {
      weights: {
        tripType_primary: 30,
        tripType_secondary: 15,
        budget_exact: 25,
        budget_adjacent: 12,
        climate_exact: 20,
        activities_total: 15,
        company_match: 10,
      },
      budgetOrder: ["economic", "moderate", "comfort", "luxury"],
      defaults: { minImagesPerDestination: 3, minHotelsPerDestination: 3 },
    };
    return { db: cachedDB, rules: cachedRules };
  }
}

function calculateScore(prefs: UserPreferences, dest: Destination, rules: Rules) {
  const w = rules.weights || {};
  let score = 0;
  if (prefs.tripType === dest.primaryType) score += w.tripType_primary || 0;
  else if (dest.secondaryTypes.includes(prefs.tripType || "")) score += w.tripType_secondary || 0;
  if (prefs.budget === dest.priceRange) score += w.budget_exact || 0;
  const budgetOrder = rules.budgetOrder || ["economic", "moderate", "comfort", "luxury"];
  if (
    prefs.budget &&
    Math.abs(budgetOrder.indexOf(prefs.budget) - budgetOrder.indexOf(dest.priceRange)) === 1
  ) {
    score += w.budget_adjacent || 0;
  }
  if (prefs.climate === dest.climate) score += w.climate_exact || 0;
  const userActs = new Set(prefs.activities || []);
  const matches = dest.availableActivities.filter((a) => userActs.has(a)).length;
  if (userActs.size > 0) score += (matches / userActs.size) * (w.activities_total || 0);
  if (prefs.company && dest.recommendedFor.includes(prefs.company)) score += w.company_match || 0;
  return score;
}

async function fetchDestinationImages(
  query: string,
  min = 5,
  coords?: { lat: number; lon: number }
): Promise<{ url: string; alt?: string }[]> {
  const perPage = Math.max(3, min);
  // Primero: imágenes locales de POIs si hay coordenadas (mayor relevancia)
  try {
    if (coords && process.env.OPENTRIPMAP_API_KEY) {
      const pois = await fetchPOIsFromOpenTripMap(coords.lat, coords.lon, Math.max(5, min), 10);
      const otmUrls = filterAllowedImages((pois.map((p) => p.image).filter(Boolean) as string[]));
      if (otmUrls.length >= Math.min(3, min)) {
        return otmUrls.slice(0, perPage).map((u) => ({ url: u, alt: query }));
      }
    }
  } catch {}

  // Consulta genérica reforzada, mejor para destinos históricos/naturales
  const enhancedQuery = `${query} landmarks historic center city center tourism`;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const pexelsKey = process.env.PEXELS_API_KEY;
  const pixabayKey = process.env.PIXABAY_API_KEY;

  // Unsplash primero
  if (unsplashKey) {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(enhancedQuery)}&per_page=${perPage}&orientation=landscape&content_filter=high`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Client-ID ${unsplashKey}` } });
      if (res.ok) {
        const json = await res.json();
        const images: { url: string; alt?: string }[] = (json.results || []).map((r: any) => ({
          url: r.urls?.regular || r.urls?.small || r.urls?.raw,
          alt: r.alt_description || query,
        }));
        if (images.length > 0) return images;
      }
    } catch (e) {
      console.error("Error Unsplash:", e);
    }
  }

  // Pexels como fallback
  if (pexelsKey) {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", enhancedQuery);
    url.searchParams.set("per_page", String(perPage));
    try {
      const res = await fetch(url.toString(), { headers: { Authorization: pexelsKey } });
      if (res.ok) {
        const json = await res.json();
        const photos = Array.isArray(json.photos) ? json.photos : [];
        const images: { url: string; alt?: string }[] = photos.map((p: any) => ({
          url: p.src?.large || p.src?.medium || p.src?.small,
          alt: query,
        }))
        .filter((i: any) => typeof i.url === "string");
        if (images.length > 0) return images.slice(0, perPage);
      }
    } catch (e) {
      console.error("Error Pexels:", e);
    }
  }

  // Pixabay como último fallback
  if (pixabayKey) {
    const url = new URL("https://pixabay.com/api/");
    url.searchParams.set("key", pixabayKey);
    url.searchParams.set("q", enhancedQuery);
    url.searchParams.set("image_type", "photo");
    url.searchParams.set("per_page", String(perPage));
    try {
      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        const hits = Array.isArray(json.hits) ? json.hits : [];
        const images: { url: string; alt?: string }[] = hits.map((h: any) => ({
          url: h.webformatURL || h.largeImageURL,
          alt: query,
        }))
        .filter((i: any) => typeof i.url === "string");
        if (images.length > 0) return images.slice(0, perPage);
      }
    } catch (e) {
      console.error("Error Pixabay:", e);
    }
  }

  // Fallback con Wikipedia (ciudad/pais más representativos)
  const wikiUrban = await fetchWikipediaImages(`${query} city center`, perPage);
  if (wikiUrban.length > 0) return wikiUrban;
  const wikiLandmarks = await fetchWikipediaImages(`${query} landmarks`, perPage);
  if (wikiLandmarks.length > 0) return wikiLandmarks;

  // Último recurso: íconos locales
  return [
    { url: "/globe.svg", alt: query },
    { url: "/window.svg", alt: query },
    { url: "/next.svg", alt: query },
  ];
}

// Helper: imágenes desde Wikipedia (sin API keys), prioriza thumbnails grandes
async function fetchWikipediaImages(
  query: string,
  perPage: number
): Promise<{ url: string; alt?: string }[]> {
  try {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    url.searchParams.set("prop", "pageimages");
    url.searchParams.set("piprop", "thumbnail|original");
    url.searchParams.set("pithumbsize", "1200");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", query);
    url.searchParams.set("gsrlimit", String(Math.max(1, perPage)));
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const json = await res.json();
    const pages = (json.query?.pages) || {};
    const items = Object.values(pages);
    const images = (items as any[])
      .map((p: any) => {
        const src = p.original?.source || p.thumbnail?.source;
        const alt = p.title || query;
        if (typeof src === "string") return { url: src, alt };
        return null;
      })
      .filter(Boolean) as { url: string; alt?: string }[];
    return images.slice(0, perPage);
  } catch (e) {
    console.error("Error Wikipedia images:", e);
    return [];
  }
}

// Utilidad para aleatorizar resultados y evitar siempre el mismo orden
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deduplicación de hoteles por destino (nombre+dirección normalizados)
function normalizeText(s: string): string {
  let t = (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  // eliminar puntuación y símbolos
  t = t.replace(/[^a-z0-9\s]/g, " ");
  // quitar artículos y prefijos comunes (es/en)
  t = t.replace(/\b(el|la|los|las|the)\b/g, " ");
  // quitar tipos de alojamiento que causan duplicidad de nombre
  t = t.replace(/\b(gran|hotel|hostal|hostel|resort|boutique|apart|aparthotel|inn|suites|spa|&|and)\b/g, " ");
  // colapsar espacios
  t = t.replace(/\s+/g, " ").trim();
  // asegurar que quede una clave útil
  if (t.length < 4) return (s || "").toLowerCase().trim();
  return t;
}

function normalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    return `${url.protocol}//${url.host}${url.pathname}`.toLowerCase();
  } catch {
    return (u || "").toLowerCase();
  }
}

function dedupImageUrls(imgs: string[]): string[] {
  const set = new Set<string>();
  const out: string[] = [];
  for (const u of imgs || []) {
    const key = normalizeUrl(u);
    if (!set.has(key)) {
      set.add(key);
      out.push(u);
    }
  }
  return out;
}

type Hotel = {
  name: string;
  stars: number;
  address: string;
  pricePerNight: Record<string, number>;
  images: string[];
  amenities: string[];
  rating: number;
  bookingUrl: string;
  lat?: number;
  lon?: number;
};

function dedupHotels(list: Hotel[]): Hotel[] {
  const byName = new Map<string, Hotel>();
  const proximityThresholdMeters = 200; // considerar el mismo hotel si está a <200m

  // Haversine aproximado para cercanía
  const distM = (a: Hotel, b: Hotel): number | null => {
    if (typeof a.lat !== "number" || typeof a.lon !== "number" || typeof b.lat !== "number" || typeof b.lon !== "number") {
      return null;
    }
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000; // m
    const dLat = toRad((b.lat as number) - (a.lat as number));
    const dLon = toRad((b.lon as number) - (a.lon as number));
    const lat1 = toRad(a.lat as number);
    const lat2 = toRad(b.lat as number);
    const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const d = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * d;
  };

  for (const h of list || []) {
    const nameKey = normalizeText(h.name);
    const existing = byName.get(nameKey);
    if (!existing) {
      // normalizar imágenes internas
      h.images = dedupImageUrls(filterAllowedImages(h.images || []));
      byName.set(nameKey, h);
      continue;
    }
    // Si hay proximidad geográfica o bookingUrl coincide, fusionar
    const d = distM(existing, h);
    const sameBooking = normalizeUrl(existing.bookingUrl || "") === normalizeUrl(h.bookingUrl || "");
    if (sameBooking || (d !== null && d <= proximityThresholdMeters)) {
      // fusionar datos: conservar el mejor
      existing.stars = Math.max(existing.stars || 0, h.stars || 0);
      existing.rating = Math.max(existing.rating || 0, h.rating || 0);
      // si no hay dirección, tomar la disponible
      if (!existing.address && h.address) existing.address = h.address;
      // combinar precios (preferir menor por moneda)
      const mergedPrices: Record<string, number> = { ...(existing.pricePerNight || {}) };
      for (const [cur, val] of Object.entries(h.pricePerNight || {})) {
        mergedPrices[cur] = Math.min(mergedPrices[cur] ?? val, val);
      }
      existing.pricePerNight = mergedPrices;
      // combinar imágenes y amenities
      existing.images = dedupImageUrls([...(existing.images || []), ...(h.images || [])]);
      const amenSet = new Set([...(existing.amenities || []), ...(h.amenities || [])]);
      existing.amenities = Array.from(amenSet);
      // coordenadas: mantener si faltaban
      if (typeof existing.lat !== "number" && typeof h.lat === "number") existing.lat = h.lat;
      if (typeof existing.lon !== "number" && typeof h.lon === "number") existing.lon = h.lon;
    } else {
      // si no parecen el mismo, crear una clave alternativa con dirección
      const addrKey = `${nameKey}|${normalizeText(h.address || "")}`;
      if (!byName.has(addrKey)) {
        h.images = dedupImageUrls(filterAllowedImages(h.images || []));
        byName.set(addrKey, h);
      }
    }
  }
  // devolver valores únicos
  const uniques: Hotel[] = [];
  const seen = new Set<string>();
  for (const [k, h] of byName.entries()) {
    const baseKey = normalizeText(h.name);
    if (!seen.has(baseKey)) {
      seen.add(baseKey);
      uniques.push(h);
    }
  }
  return uniques;
}

// Unificar nombres e imágenes para que no se repitan dentro del destino
async function ensureUniqueNamesAndImages(
  hotels: Hotel[],
  destName: string,
  coords?: { lat: number; lon: number }
): Promise<Hotel[]> {
  const usedNames = new Set<string>();
  const usedHero = new Set<string>();

  const tokens: string[] = [];
  const parts = (destName || "").split(/\s+/).filter(Boolean);
  // tokens inspirados en el destino + genéricos
  tokens.push(...parts);
  tokens.push("Centro", "Histórico", "Norte", "Sur", "Este", "Oeste");
  tokens.push("Río", "Mirador", "Colinas", "Parque", "Cascadas", "Mar", "Playa");

  const nextToken = ((i = 0) => () => tokens[i++ % tokens.length])();

  const out: Hotel[] = [];
  for (const h of hotels || []) {
    // Nombre único
    let norm = normalizeText(h.name);
    if (usedNames.has(norm)) {
      const t = nextToken();
      const candidate = `${h.name} ${t}`;
      norm = normalizeText(candidate);
      h.name = candidate;
    }
    usedNames.add(norm);

    // Imágenes únicas (hero)
    let imgs = dedupImageUrls(filterAllowedImages(h.images || []));
    const first = imgs[0];
    const heroKey = first ? normalizeUrl(first) : "";
    if (heroKey && usedHero.has(heroKey)) {
      // buscar otra imagen disponible
      const alt = imgs.find((u) => !usedHero.has(normalizeUrl(u)));
      if (alt) {
        imgs = [alt, ...imgs.filter((u) => normalizeUrl(u) !== heroKey)];
      } else {
        // intentar conseguir una nueva imagen específica
        try {
          const more = await fetchHotelImages(h.name, destName, 2);
          const moreClean = dedupImageUrls(filterAllowedImages(more));
          const newHero = moreClean.find((u) => !usedHero.has(normalizeUrl(u)));
          if (newHero) imgs = [newHero, ...imgs];
        } catch {}
        if (imgs.length === 0) {
          try {
            const di = await fetchDestinationImages(`${destName} hotel`, 3, coords);
            const diClean = dedupImageUrls(filterAllowedImages(di.map((i) => i.url)));
            const newHero = diClean.find((u) => !usedHero.has(normalizeUrl(u)));
            if (newHero) imgs = [newHero];
          } catch {}
        }
      }
    }
    if (imgs.length === 0) imgs = ["/globe.svg"];
    usedHero.add(normalizeUrl(imgs[0]));
    h.images = imgs;

    out.push(h);
  }
  return out;
}

// --- Amadeus: Token y búsqueda de hoteles por coordenadas ---
async function getAmadeusToken(): Promise<string | null> {
  const clientId = process.env.AMADEUS_CLIENT_ID || process.env.AMADEUS_API_KEY;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET || process.env.AMADEUS_API_SECRET;
  if (!clientId || !clientSecret) return null;
  const tokenUrl = "https://test.api.amadeus.com/v1/security/oauth2/token";
  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      console.error("Error token Amadeus:", await res.text());
      return null;
    }
    const json = await res.json();
    return json.access_token as string;
  } catch (e) {
    console.error("Excepción token Amadeus:", e);
    return null;
  }
}

async function fetchHotelsFromAmadeus(
  lat: number,
  lon: number,
  minHotels: number,
  prefs: UserPreferences
): Promise<
  Array<{
    name: string;
    stars: number;
    address: string;
    pricePerNight: Record<string, number>;
    images: string[];
    amenities: string[];
    rating: number;
    bookingUrl: string;
  }>
> {
  const token = await getAmadeusToken();
  if (!token) return [];

  // Parámetros por defecto para obtener ofertas cercanas
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 14); // dos semanas
  const checkInDate = checkIn.toISOString().slice(0, 10);
  const adults = prefs.company === "couple" ? 2 : 1;

  const url = new URL("https://test.api.amadeus.com/v3/shopping/hotel-offers");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("radius", "10");
  url.searchParams.set("radiusUnit", "KM");
  url.searchParams.set("checkInDate", checkInDate);
  url.searchParams.set("adults", String(adults));
  url.searchParams.set("bestRateOnly", "true");
  url.searchParams.set("hotelSource", "ALL");

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error("Error Amadeus hoteles:", await res.text());
      return [];
    }
    const json = await res.json();
    const items = (json.data || []) as any[];
    const hotels = await Promise.all(
      shuffle(items).slice(0, Math.max(3, minHotels)).map(async (item: any) => {
        const hotel = item.hotel || {};
        const name: string = hotel.name || "Hotel";
        const stars: number = Number(hotel.rating || 0) || 0;
        const addressParts: string[] = [
          ...(hotel.address?.lines || []),
          hotel.address?.postalCode,
          hotel.address?.cityName,
          hotel.address?.countryCode,
        ].filter(Boolean);
        const address = addressParts.join(", ");
        const cityName: string = hotel.address?.cityName || "";
        const latNum: number | undefined = typeof hotel.latitude === "number" ? hotel.latitude : undefined;
        const lonNum: number | undefined = typeof hotel.longitude === "number" ? hotel.longitude : undefined;

        // Precio (asumimos 1 noche si no hay duración)
        const offer = (item.offers || [])[0] || {};
        const price = offer.price || {};
        const currency = price.currency || "USD";
        const total = Number(price.total || 0);
        const pricePerNight: Record<string, number> = { [currency]: total };

        // Imágenes: usar media del propio hotel si existe; complementar con Unsplash/Pexels
        let images: string[] = [];
        const media = hotel.media || hotel.images || [];
        if (Array.isArray(media) && media.length > 0) {
          images = media
            .map((m: any) => m.uri || m.url)
            .filter((u: any) => typeof u === "string");
        }
        // Complementar con fuentes abiertas solo si faltan imágenes propias
        if (images.length < 3) {
          const more = await fetchHotelImages(name, cityName, Math.max(1, 3 - images.length));
          images = images.concat(filterAllowedImages(more));
        }
        if (images.length === 0) {
          const destImgs = await fetchDestinationImages(`${cityName} city`, 3);
          images = filterAllowedImages(destImgs.map((i) => i.url));
        }

        const amenities: string[] = (hotel.amenities || []).filter((a: any) => typeof a === "string");
        const rating: number = stars > 0 ? stars : 4.2; // si no hay, aproximar

        const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
          name
        )}`;

        return { name, stars, address, pricePerNight, images, amenities, rating, bookingUrl, lat: latNum, lon: lonNum };
      })
    );
    return hotels;
  } catch (e) {
    console.error("Excepción Amadeus hoteles:", e);
    return [];
  }
}

// --- OpenTripMap: lugares/POIs cercanos ---
type Poi = {
  name: string;
  image?: string;
  distance?: number;
  kinds?: string;
  rate?: number;
  wikipedia?: string;
  url?: string;
};

async function fetchPOIsFromOpenTripMap(
  lat: number,
  lon: number,
  limit: number = 8,
  radiusKm: number = 5
): Promise<Poi[]> {
  const key = process.env.OPENTRIPMAP_API_KEY;
  if (!key) return [];
  const radius = Math.max(500, Math.floor(radiusKm * 1000));
  const url = new URL("https://api.opentripmap.com/0.1/en/places/radius");
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("limit", String(Math.max(5, limit)));
  url.searchParams.set("apikey", key);
  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`OTM radius ${res.status}`);
    const arr = (await res.json()) as any[];
    const toDetail = arr.filter((p) => p && p.xid).slice(0, Math.max(5, limit));
    const details = await Promise.all(
      toDetail.map(async (p) => {
        try {
          const dRes = await fetch(
            `https://api.opentripmap.com/0.1/en/places/xid/${encodeURIComponent(p.xid)}?apikey=${key}`
          );
          if (!dRes.ok) throw new Error("detail fail");
          const d = await dRes.json();
          const preview = d.preview?.source as string | undefined;
          const wikipedia = typeof d.wikipedia_extracts?.text === "string" ? d.wikipedia : undefined;
          const url = typeof d.url === "string" ? d.url : undefined;
          const kinds = typeof d.kinds === "string" ? d.kinds : p.kinds;
          return {
            name: d.name || p.name || "",
            image: preview,
            distance: typeof p.dist === "number" ? p.dist : undefined,
            kinds,
            rate: typeof p.rate === "number" ? p.rate : undefined,
            wikipedia,
            url,
          } as Poi;
        } catch {
          return {
            name: p.name || "",
            distance: typeof p.dist === "number" ? p.dist : undefined,
            kinds: p.kinds,
            rate: typeof p.rate === "number" ? p.rate : undefined,
          } as Poi;
        }
      })
    );
    return details.filter((d) => d.name);
  } catch (e) {
    console.error("Error OpenTripMap POIs:", e);
    return [];
  }
}

// Hoteles/acomodaciones dinámicos desde OpenTripMap (fallback variable)
async function fetchHotelsFromOpenTripMap(
  lat: number,
  lon: number,
  limit: number,
  prefs: UserPreferences,
  destName: string
): Promise<
  Array<{
    name: string;
    stars: number;
    address: string;
    pricePerNight: Record<string, number>;
    images: string[];
    amenities: string[];
    rating: number;
    bookingUrl: string;
  }>
> {
  const key = process.env.OPENTRIPMAP_API_KEY;
  if (!key) return [];
  const radius = Math.max(800, Math.floor(6 * 1000)); // ~6km
  const url = new URL("https://api.opentripmap.com/0.1/en/places/radius");
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("limit", String(Math.max(5, limit * 2))); // pedir más y filtrar
  url.searchParams.set("kinds", "accomodations,hotels,hostel,guest_house");
  url.searchParams.set("apikey", key);

  const priceBuckets: Record<string, [number, number]> = {
    economic: [30, 80],
    moderate: [80, 150],
    comfort: [150, 250],
    luxury: [250, 450],
  };
  const [minP, maxP] = priceBuckets[prefs.budget || "moderate"] || [80, 150];
  const amenityPool = [
    "WiFi",
    "Desayuno",
    "Piscina",
    "Spa",
    "Restaurante",
    "Bar",
    "Transporte aeropuerto",
    "Gimnasio",
  ];

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`OTM hotels radius ${res.status}`);
    const arr = (await res.json()) as any[];
    const toDetail = shuffle(arr.filter((p) => p && p.xid)).slice(0, Math.max(5, limit));
    const detailed = await Promise.all(
      toDetail.map(async (p) => {
        try {
          const dRes = await fetch(
            `https://api.opentripmap.com/0.1/en/places/xid/${encodeURIComponent(p.xid)}?apikey=${key}`
          );
          if (!dRes.ok) throw new Error("detail fail");
          const d = await dRes.json();
          const name: string = d.name || p.name || "";
          const preview: string | undefined = d.preview?.source;
          const latNum: number | undefined = typeof d.point?.lat === "number" ? d.point.lat : (typeof d.lat === "number" ? d.lat : undefined);
          const lonNum: number | undefined = typeof d.point?.lon === "number" ? d.point.lon : (typeof d.lon === "number" ? d.lon : undefined);
          const addressObj = d.address || {};
          const addrParts: string[] = [
            addressObj.road,
            addressObj.house_number,
            addressObj.city,
            addressObj.state,
            addressObj.country,
          ].filter(Boolean);
          const address = addrParts.join(", ") || destName;

          // estrellas y rating heurísticos
          const baseRate = typeof p.rate === "number" ? p.rate : 7;
          const stars = Math.max(3, Math.min(5, Math.round((baseRate / 7) * 5)));
          const rating = Math.round((3.8 + Math.random() * 1.2) * 10) / 10; // 3.8–5.0

          // precio aleatorio por presupuesto
          const price = Math.round(minP + Math.random() * (maxP - minP));
          const pricePerNight: Record<string, number> = { USD: price };

          // imágenes: usar preview y/o buscar por nombre+destino
          let images: string[] = [];
          if (preview) images.push(preview);
          if (images.length < 3) {
            const extra = await fetchHotelImages(name, destName, 3 - images.length);
            images = images.concat(extra);
          }
          images = dedupImageUrls(filterAllowedImages(images));
          if (images.length === 0) images = ["/globe.svg"];

          // amenities aleatorias
          const amenities = shuffle(amenityPool).slice(0, 3);
          const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(name + " " + destName)}`;

          return { name, stars, address, pricePerNight, images, amenities, rating, bookingUrl, lat: latNum, lon: lonNum };
        } catch (e) {
          return null;
        }
      })
    );
    return detailed.filter(Boolean) as Array<{
      name: string;
      stars: number;
      address: string;
      pricePerNight: Record<string, number>;
      images: string[];
      amenities: string[];
      rating: number;
      bookingUrl: string;
    }>;
  } catch (e) {
    console.error("Error OpenTripMap Hoteles:", e);
    return [];
  }
}

// --- Imágenes de hoteles: Unsplash → Pexels → Pixabay → Wikipedia ---
async function fetchHotelImages(name: string, city: string, count = 3): Promise<string[]> {
  const queries = [
    [name, city, "hotel exterior"].filter(Boolean).join(" "),
    [name, city, "hotel facade"].filter(Boolean).join(" "),
    [name, city, "resort exterior"].filter(Boolean).join(" "),
    [city, "hotel exterior"].filter(Boolean).join(" "),
    [name, "hotel"].filter(Boolean).join(" "),
    [name, city].filter(Boolean).join(" "),
    name,
  ];

  // Unsplash
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (unsplashKey) {
    for (const q of queries) {
      try {
        const url = new URL("https://api.unsplash.com/search/photos");
        url.searchParams.set("query", q);
        url.searchParams.set("orientation", "landscape");
        url.searchParams.set("content_filter", "high");
        url.searchParams.set("order_by", "relevant");
        url.searchParams.set("per_page", String(Math.max(1, count)));
        const res = await fetch(url.toString(), {
          headers: { Authorization: `Client-ID ${unsplashKey}` },
        });
        if (res.ok) {
          const data = (await res.json()) as any;
          const items = Array.isArray(data.results) ? data.results : [];
          const imgs = items
            .map((r: any) => r.urls?.regular || r.urls?.small)
            .filter((u: any) => typeof u === "string");
          const allowed = filterAllowedImages(imgs);
          if (allowed.length > 0) return Array.from(new Set(allowed)).slice(0, count);
        }
      } catch {}
    }
  }

  // Pexels
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    for (const q of queries) {
      try {
        const url = new URL("https://api.pexels.com/v1/search");
        url.searchParams.set("query", q);
        url.searchParams.set("orientation", "landscape");
        url.searchParams.set("size", "large");
        url.searchParams.set("per_page", String(Math.max(1, count)));
        const res = await fetch(url.toString(), {
          headers: { Authorization: pexelsKey },
        });
        if (res.ok) {
          const data = (await res.json()) as any;
          const items = Array.isArray(data.photos) ? data.photos : [];
          const imgs = items
            .map((p: any) => p.src?.landscape || p.src?.large2x || p.src?.large || p.src?.medium)
            .filter((u: any) => typeof u === "string");
          const allowed = filterAllowedImages(imgs);
          if (allowed.length > 0) return Array.from(new Set(allowed)).slice(0, count);
        }
      } catch {}
    }
  }

  // Pixabay
  const pixabayKey = process.env.PIXABAY_API_KEY;
  if (pixabayKey) {
    for (const q of queries) {
      try {
        const url = new URL("https://pixabay.com/api/");
        url.searchParams.set("key", pixabayKey);
        url.searchParams.set("q", q);
        url.searchParams.set("image_type", "photo");
        url.searchParams.set("category", "travel");
        url.searchParams.set("safesearch", "true");
        url.searchParams.set("per_page", String(Math.max(1, count)));
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = (await res.json()) as any;
          const items = Array.isArray(data.hits) ? data.hits : [];
          const imgs = items
            .map((h: any) => h.largeImageURL || h.webformatURL)
            .filter((u: any) => typeof u === "string");
          const allowed = filterAllowedImages(imgs);
          if (allowed.length > 0) return Array.from(new Set(allowed)).slice(0, count);
        }
      } catch {}
    }
  }

  // Fallback sin API: Wikipedia (más relevante que aleatorio)
  for (const q of [...queries, `${city} hotel`, `${city} city skyline`, `${city} landmarks`]) {
    const imgs = await fetchWikipediaImages(q, Math.max(1, count));
    const urls = imgs.map((i) => i.url);
    const allowed = filterAllowedImages(urls);
    if (allowed.length > 0) return Array.from(new Set(allowed)).slice(0, count);
  }
  return [];
}

export async function POST(req: Request) {
  const { userPreferences } = await req.json();
  const prefs: UserPreferences = userPreferences || {};
  const useWebhook = process.env.RECOMMEND_USE_WEBHOOK === 'true';
  const webhook = useWebhook
    ? (process.env.N8N_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL)
    : undefined;

  if (useWebhook && webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPreferences: prefs }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    } catch (e) {
      console.error("Error llamando webhook n8n:", e);
      // En caso de falla, continuar con fallback
    }
  }

  // Fallback local (config + reglas)
  const { db, rules } = await loadConfig();
  const scored = (db as Destination[]).map((d) => ({ ...d, score: calculateScore(prefs, d, rules as Rules) }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);
  const destQuery = `${top[0].name} ${top[0].country}`;
  const images = await fetchDestinationImages(
    destQuery,
    (rules.defaults?.minImagesPerDestination as number) || 5,
    top[0].coordinates
  );
  const minHotels = (rules.defaults?.minHotelsPerDestination as number) || 5;
  const amadeusHotels = await fetchHotelsFromAmadeus(
    top[0].coordinates.lat,
    top[0].coordinates.lon,
    minHotels,
    prefs
  );
  const pois = await fetchPOIsFromOpenTripMap(top[0].coordinates.lat, top[0].coordinates.lon, 8, 8);

  // Si no hay hoteles de Amadeus, construir una lista dinámica con imágenes vía API
  let hotels: Array<{
    name: string;
    stars: number;
    address: string;
    pricePerNight: Record<string, number>;
    images: string[];
    amenities: string[];
    rating: number;
    bookingUrl: string;
  }> = [];

  const cityOrDest = top[0].name;
  if (amadeusHotels.length >= minHotels) {
    hotels = shuffle(amadeusHotels).slice(0, minHotels);
  } else if (amadeusHotels.length > 0) {
    const otmFallback = await fetchHotelsFromOpenTripMap(
      top[0].coordinates.lat,
      top[0].coordinates.lon,
      minHotels,
      prefs,
      cityOrDest
    );
    hotels = shuffle([...amadeusHotels, ...otmFallback]).slice(0, minHotels);
  } else {
    // Sin Amadeus: usar OTM para generar una lista variable
    hotels = await fetchHotelsFromOpenTripMap(
      top[0].coordinates.lat,
      top[0].coordinates.lon,
      minHotels,
      prefs,
      cityOrDest
    );
  }

  // Asegurar hoteles únicos y propios del destino
  hotels = dedupHotels(hotels);
  hotels = await ensureUniqueNamesAndImages(hotels, cityOrDest, top[0].coordinates);

  // Fallback final: si seguimos sin hoteles (p.e. sin API keys), generar sintéticos variables
  if (hotels.length === 0) {
    const amenityPool = [
      "WiFi",
      "Desayuno",
      "Piscina",
      "Spa",
      "Restaurante",
      "Bar",
      "Transporte aeropuerto",
      "Gimnasio",
    ];
    const budgetRanges: Record<string, [number, number]> = {
      economic: [30, 80],
      moderate: [80, 150],
      comfort: [150, 250],
      luxury: [250, 450],
    };
    const [minP, maxP] = budgetRanges[prefs.budget || "moderate"] || [80, 150];

    const lodgingType = prefs.lodging || "hotel";
    const typeToPrefix: Record<string, string[]> = {
      hotel: ["Hotel", "Gran Hotel", "Hotel Real"],
      resort: ["Resort", "Beach Resort", "Resort & Spa"],
      hostel: ["Hostal", "Hostel", "Albergue"],
      airbnb: ["Apart", "Suites", "Residencias"],
      boutique: ["Hotel Boutique", "Boutique", "Casa Boutique"],
    };
    const adjectives = [
      "Centro", "Colonial", "Mirador", "Andino", "Playa Azul",
      "Imperial", "Del Bosque", "Sol y Mar", "Real", "Palace",
    ];

    const synthCount = Math.max(3, minHotels);
    hotels = await Promise.all(
      Array.from({ length: synthCount }).map(async () => {
        const prefixList = typeToPrefix[lodgingType] || typeToPrefix["hotel"];
        const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const name = `${prefix} ${adj}`;
        const starsByType: Record<string, [number, number]> = {
          resort: [4, 5],
          boutique: [4, 5],
          hotel: [3, 5],
          hostel: [2, 3],
          airbnb: [0, 4],
        };
        const [minStars, maxStars] = starsByType[lodgingType] || [3, 5];
        const stars = Math.max(minStars, Math.min(maxStars, minStars + Math.floor(Math.random() * (maxStars - minStars + 1))));
        const rating = Math.round((3.9 + Math.random() * 1.1) * 10) / 10; // 3.9–5.0
        const price = Math.round(minP + Math.random() * (maxP - minP));
        const pricePerNight: Record<string, number> = { USD: price };
        const address = `${cityOrDest}`;

        let images: string[] = [];
        try {
          images = await fetchHotelImages(name, cityOrDest, 3);
          if (images.length === 0) {
            const destImgs = await fetchDestinationImages(`${cityOrDest} hotel`, 3);
            images = destImgs.map((i) => i.url);
          }
        } catch {}
        images = dedupImageUrls(filterAllowedImages(images));
        images = dedupImageUrls(filterAllowedImages(images));
        if (images.length === 0) images = ["/globe.svg"];

        const amenities = shuffle(amenityPool).slice(0, 3);
        const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(name + " " + cityOrDest)}`;
        return { name, stars, address, pricePerNight, images, amenities, rating, bookingUrl };
      })
    );
    hotels = shuffle(hotels).slice(0, minHotels);
  }

  // Ajuste final: mantener cantidad mínima tras unificación
  hotels = shuffle(hotels).slice(0, minHotels);

  const response = {
    destination: {
      name: `${top[0].name}, ${top[0].country}`,
      description: top[0].description,
      images,
      climate: top[0].climate,
      activities: top[0].availableActivities,
      tips: "Mejor época: temporada seca. Lleva ropa cómoda y protector solar.",
      costRange: top[0].priceRange,
      coordinates: top[0].coordinates,
    },
    alternatives: top.slice(1).map((d) => ({
      name: `${d.name}, ${d.country}`,
      climate: d.climate,
      activities: d.availableActivities,
      costRange: d.priceRange,
    })),
    pois,
    hotels,
  };

  return NextResponse.json(response);
}

export async function GET(req: Request) {
  const { db, rules } = await loadConfig();
  const url = new URL(req.url);
  const nameParam = url.searchParams.get("name") || "";
  const countryParam = url.searchParams.get("country") || "";

  const norm = (s: string) => s.trim().toLowerCase();
  const targetName = norm(nameParam);
  const targetCountry = norm(countryParam);

  const dest = (db as Destination[]).find((d) => {
    const n = norm(d.name);
    const c = norm(d.country);
    const nameMatch = n === targetName || n.includes(targetName);
    const countryMatch = !targetCountry || c === targetCountry || c.includes(targetCountry);
    return nameMatch && countryMatch;
  });

  if (!dest) {
    return NextResponse.json({ error: "Destino no encontrado" }, { status: 404 });
  }

  const destQuery = `${dest.name} ${dest.country}`;
  const images = await fetchDestinationImages(
    destQuery,
    (rules.defaults?.minImagesPerDestination as number) || 5,
    dest.coordinates
  );

  const minHotels = (rules.defaults?.minHotelsPerDestination as number) || 5;
  const prefs: UserPreferences = {};
  let hotels = await fetchHotelsFromAmadeus(dest.coordinates.lat, dest.coordinates.lon, minHotels, prefs);
  if (!hotels || hotels.length < minHotels) {
    const extra = await fetchHotelsFromOpenTripMap(
      dest.coordinates.lat,
      dest.coordinates.lon,
      minHotels,
      prefs,
      dest.name
    );
    hotels = dedupHotels(hotels.concat(extra));
  }

  // Fallback final: si seguimos sin hoteles (p.e. sin API keys), generar sintéticos variables
  if (!hotels || hotels.length === 0) {
    const amenityPool = [
      "WiFi",
      "Desayuno",
      "Piscina",
      "Spa",
      "Restaurante",
      "Bar",
      "Transporte aeropuerto",
      "Gimnasio",
    ];
    const budgetRanges: Record<string, [number, number]> = {
      economic: [30, 80],
      moderate: [80, 150],
      comfort: [150, 250],
      luxury: [250, 450],
    };
    const [minP, maxP] = budgetRanges[prefs.budget || "moderate"] || [80, 150];

    const lodgingType = prefs.lodging || "hotel";
    const typeToPrefix: Record<string, string[]> = {
      hotel: ["Hotel", "Gran Hotel", "Hotel Real"],
      resort: ["Resort", "Beach Resort", "Resort & Spa"],
      hostel: ["Hostal", "Hostel", "Albergue"],
      airbnb: ["Apart", "Suites", "Residencias"],
      boutique: ["Hotel Boutique", "Boutique", "Casa Boutique"],
    };
    const adjectives = [
      "Centro", "Colonial", "Mirador", "Andino", "Playa Azul",
      "Imperial", "Del Bosque", "Sol y Mar", "Real", "Palace",
    ];

    const cityOrDest = dest.name;
    const synthCount = Math.max(3, minHotels);
    hotels = await Promise.all(
      Array.from({ length: synthCount }).map(async () => {
        const prefixList = typeToPrefix[lodgingType] || typeToPrefix["hotel"];
        const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const name = `${prefix} ${adj}`;
        const starsByType: Record<string, [number, number]> = {
          resort: [4, 5],
          boutique: [4, 5],
          hotel: [3, 5],
          hostel: [2, 3],
          airbnb: [0, 4],
        };
        const [minStars, maxStars] = starsByType[lodgingType] || [3, 5];
        const stars = Math.max(minStars, Math.min(maxStars, minStars + Math.floor(Math.random() * (maxStars - minStars + 1))));
        const rating = Math.round((3.9 + Math.random() * 1.1) * 10) / 10; // 3.9–5.0
        const price = Math.round(minP + Math.random() * (maxP - minP));
        const pricePerNight: Record<string, number> = { USD: price };
        const address = `${cityOrDest}`;

        let images: string[] = [];
        try {
          images = await fetchHotelImages(name, cityOrDest, 3);
          if (images.length === 0) {
            const destImgs = await fetchDestinationImages(`${cityOrDest} hotel`, 3);
            images = destImgs.map((i) => i.url);
          }
        } catch {}
        if (images.length === 0) images = ["/globe.svg"];

        const amenities = shuffle(amenityPool).slice(0, 3);
        const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(name + " " + cityOrDest)}`;
        return { name, stars, address, pricePerNight, images, amenities, rating, bookingUrl };
      })
    );
    // Se deduplica y se unifican nombres e imágenes al final
  }

  // Unificación final de nombres e imágenes por destino
  hotels = await ensureUniqueNamesAndImages(hotels, dest.name, dest.coordinates);
  hotels = shuffle(hotels).slice(0, minHotels);

  const pois = await fetchPOIsFromOpenTripMap(dest.coordinates.lat, dest.coordinates.lon, 8, 8);

  const response = {
    destination: {
      name: `${dest.name}, ${dest.country}`,
      description: dest.description,
      images,
      climate: dest.climate,
      activities: dest.availableActivities,
      tips: "Mejor época: temporada seca. Lleva ropa cómoda y protector solar.",
      costRange: dest.priceRange,
      coordinates: dest.coordinates,
    },
    hotels,
    pois,
  };

  return NextResponse.json(response);
}