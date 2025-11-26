"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Compass, Calculator, DollarSign, Hotel, Star, ThermometerSun, Info, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Results = {
  destination: {
    name: string;
    description?: string;
    images: { url: string; alt?: string }[];
    climate?: string;
    activities?: string[];
    tips?: string;
    costRange?: string;
    coordinates?: { lat: number; lon: number };
  };
  hotels: Array<{
    name: string;
    stars: number;
    address: string;
    pricePerNight: Record<string, number>;
    images: string[];
    amenities: string[];
    rating: number;
    bookingUrl: string;
  }>;
};

type Budget = {
  distanceKm: number;
  flight: number;
  daily: number;
  lodging: number;
  total: number;
  perPerson: number;
};

export default function DashboardDestino() {
  const router = useRouter();
  const [data, setData] = useState<Results | null>(null);
  const destination = data?.destination;
  const totalImages = destination?.images?.length || 0;
  const [currentImage, setCurrentImage] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Array<{ name: string; country: string }>>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [origin, setOrigin] = useState<string>("");
  const [travelers, setTravelers] = useState<number>(1);
  const [nights, setNights] = useState<number>(3);
  const [travelClass, setTravelClass] = useState<string>("economy");
  const [rooms, setRooms] = useState<number>(1);
  const [selectedHotel, setSelectedHotel] = useState<string>("");
  const [budget, setBudget] = useState<Budget | null>(null);
  const [budgetRef, setBudgetRef] = useState<string>("");
  const [tripPaid, setTripPaid] = useState<boolean>(false);
  const [paidHotels, setPaidHotels] = useState<string[]>([]);
  const [deletingTrip, setDeletingTrip] = useState<boolean>(false);
  const [pendingBookings, setPendingBookings] = useState<Array<{ id: string; destination: string; hotel: string; createdAt: number }>>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sv_user");
      if (!raw) window.location.href = "/login";
    } catch {}
    try {
      const r = localStorage.getItem("sv_results");
      if (r) setData(JSON.parse(r));
    } catch {}
    try {
      const o = localStorage.getItem("sv_origin");
      if (o) setOrigin(o);
    } catch {}
    try {
      const rawList = localStorage.getItem("sv_pending_bookings");
      setPendingBookings(rawList ? JSON.parse(rawList) : []);
    } catch {}
  }, []);

  useEffect(() => {
    setCurrentImage(0);
  }, [destination?.name]);

  const buscarDestino = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchError("");
    try {
      const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const parts = q.split(",").map((s) => s.trim()).filter(Boolean);
      let name = parts[0] || "";
      let country = parts[1] || "";
      const aliasMap: Record<string, string> = { "cuzco": "cusco" };
      const nKey = strip(name);
      if (aliasMap[nKey]) name = aliasMap[nKey];
      const url = `/api/recommend?name=${encodeURIComponent(name)}${country ? `&country=${encodeURIComponent(country)}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Destino no encontrado");
      const j = await res.json();
      // Actualizar resultados y persistir
      setData(j);
      try { localStorage.setItem("sv_results", JSON.stringify(j)); } catch {}
      setCurrentImage(0);
      // Reiniciar estados dependientes del destino
      setSelectedHotel("");
      setBudget(null);
      setBudgetRef("");
      setTripPaid(false);
      setPaidHotels([]);
    } catch (e) {
      setSearchError("No se encontró el destino. Intente con 'Ciudad, País'.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Autocompletado: sugerencias con debounce
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) { setSuggestions([]); setActiveSuggestion(-1); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/destinations?q=${encodeURIComponent(q)}&limit=7`, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          const items = Array.isArray(j?.items) ? j.items : [];
          setSuggestions(items);
          setActiveSuggestion(-1);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cargar pagos del usuario para ocultar acciones si ya está pagado y filtrar hoteles pagados
  useEffect(() => {
    (async () => {
      if (!destination?.name) return;
      try {
        const rawUser = localStorage.getItem("sv_user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        const url = user?.email ? `/api/payments?email=${encodeURIComponent(user.email)}` : `/api/payments`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          const items = Array.isArray(j?.items) ? j.items : [];
          const normalize = (s: any) => {
            try { return decodeURIComponent(String(s)); } catch { return String(s); }
          };
          const destName = destination.name;
          const tripIsPaid = items.some((r: any) => (r.type === "trip" || r.type === "TRIP") && normalize(r.destination) === destName);
          const hotelsPaid = items
            .filter((r: any) => (r.type === "hotel" || r.type === "HOTEL") && normalize(r.destination) === destName && r.hotel)
            .map((r: any) => String(r.hotel));
          setTripPaid(Boolean(tripIsPaid));
          setPaidHotels(hotelsPaid);
        }
      } catch {}
    })();
  }, [destination?.name]);

  const reservar = (hotelName: string) => {
    if (!destination) return;
    const hotel = (data?.hotels || []).find((h) => h.name === hotelName);
    if (!hotel) return;
    try {
      // Registrar como pendiente antes de navegar
      try {
        const id = `${destination.name}||${hotel.name}`;
        const rawList = localStorage.getItem("sv_pending_bookings");
        const list: Array<{ id: string; destination: string; hotel: string; createdAt: number }> = rawList ? JSON.parse(rawList) : [];
        if (!list.some((x) => x.id === id)) {
          const updated = [...list, { id, destination: destination.name, hotel: hotel.name, createdAt: Date.now() }];
          localStorage.setItem("sv_pending_bookings", JSON.stringify(updated));
          setPendingBookings(updated);
        }
      } catch {}
      const dest = encodeURIComponent(destination.name);
      const h = encodeURIComponent(hotel.name);
      router.push(`/dashboard/reserva?dest=${dest}&hotel=${h}`);
    } catch {}
  };

  const pagarViaje = () => {
    if (!destination || !budget || !budgetRef) return;
    try {
      router.push(`/dashboard/pago?ref=${encodeURIComponent(budgetRef)}`);
    } catch {}
  };

  const eliminarPagoDestino = async () => {
    if (!destination) return;
    setDeletingTrip(true);
    try {
      const rawUser = localStorage.getItem("sv_user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      await fetch("/api/payments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "trip", userEmail: user?.email || null, destination: destination.name }),
      });
      setTripPaid(false);
    } catch {}
    setDeletingTrip(false);
  };

  const calcularPresupuesto = async () => {
    if (!destination) return;
    try {
      if (origin) localStorage.setItem("sv_origin", origin);
      const [destName, destCountry] = destination.name.split(",").map((s) => s.trim());
      const hotelObj = (data?.hotels || []).find((h) => h.name === selectedHotel);
      const hotelPrice = hotelObj?.pricePerNight?.USD ?? undefined;
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destinationName: destName,
          destinationCountry: destCountry,
          travellers: travelers,
          nights,
          travelClass,
          hotelPricePerNightUSD: hotelPrice,
          rooms,
        }),
      });
      if (!res.ok) throw new Error("No se pudo calcular el presupuesto");
      const j = await res.json();
      // Asegurar que los campos sean números (API devuelve objetos con total)
      setBudget({
        distanceKm: j.distanceKm,
        flight: j?.flight?.total ?? j.flight ?? 0,
        daily: j?.daily?.total ?? j.daily ?? 0,
        lodging: j?.lodging?.total ?? j.lodging ?? 0,
        total: j.total ?? 0,
        perPerson: j.perPerson ?? 0,
      });
      // Guardar presupuesto en Postgres
      try {
        const rawUser = localStorage.getItem("sv_user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        const ref = `BUD-${Date.now()}`;
        setBudgetRef(ref);
        await fetch("/api/trip-budget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ref,
            userEmail: user?.email || null,
            origin,
            destinationName: destName,
            destinationCountry: destCountry,
            travellers: travelers,
            nights,
            travelClass,
            hotel: hotelObj ? { name: hotelObj.name, pricePerNight: hotelObj.pricePerNight?.USD || 0 } : null,
            rooms,
            breakdown: {
              distanceKm: j.distanceKm,
              flight: j.flight,
              daily: j.daily,
              lodging: j.lodging,
              total: j.total,
              perPerson: j.perPerson,
            },
          }),
        });
      } catch (e) {
        console.warn("No se pudo guardar presupuesto en DB", e);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const nextImg = () => totalImages > 0 && setCurrentImage((i) => (i + 1) % totalImages);
  const prevImg = () => totalImages > 0 && setCurrentImage((i) => (i - 1 + totalImages) % totalImages);

  if (!destination) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="text-slate-700">No hay destino cargado. Completa el Cuestionario y vuelve a esta sección.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Compass className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-900">{destination.name}</h1>
      </div>
      <p className="text-slate-600">Configura tu viaje, calcula el presupuesto y reserva tu hotel.</p>

      {/* Acciones: Ajustar preferencias y Buscar destino */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <button
          onClick={() => { try { router.push("/dashboard/questionnaire"); } catch {} }}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2"
        >
          Ajustar preferencias
        </button>
        <div className="flex flex-1 gap-2 relative">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActiveSuggestion((i) => Math.min((suggestions.length ? suggestions.length - 1 : -1), i + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActiveSuggestion((i) => Math.max(-1, i - 1)); }
              if (e.key === "Enter") {
                if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
                  const s = suggestions[activeSuggestion];
                  const v = `${s.name}, ${s.country}`;
                  setSearchQuery(v);
                  setSuggestions([]);
                  buscarDestino();
                } else {
                  buscarDestino();
                }
              }
            }}
            placeholder="Buscar destino (Ciudad, País)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
          />
          <button
            onClick={buscarDestino}
            disabled={searchLoading || !searchQuery.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white font-semibold px-4 py-2 disabled:opacity-50"
          >
            {searchLoading ? "Buscando…" : "Buscar destino"}
          </button>
          {suggestions.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 z-10 bg-white border border-slate-200 rounded-lg shadow divide-y divide-slate-100">
              {suggestions.map((s, idx) => (
                <button
                  key={`${s.name}-${s.country}-${idx}`}
                  onMouseEnter={() => setActiveSuggestion(idx)}
                  onClick={() => { const v = `${s.name}, ${s.country}`; setSearchQuery(v); setSuggestions([]); buscarDestino(); }}
                  className={`w-full text-left px-3 py-2 text-sm ${activeSuggestion === idx ? "bg-slate-100" : "bg-white"}`}
                >
                  <span className="font-medium text-slate-900">{s.name}</span>
                  <span className="text-slate-600">, {s.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {searchError && (
          <div className="text-sm text-red-600">{searchError}</div>
        )}
      </div>

      {/* Hero destino con carrusel */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {totalImages > 0 ? (
          <div className="relative w-full h-[320px] md:h-[420px]">
            <Image
              src={destination.images[currentImage].url || "/globe.svg"}
              alt={destination.images[currentImage].alt || destination.name}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            {totalImages > 1 && (
              <>
                <button onClick={prevImg} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow">
                  {/* left */}
                  <span className="sr-only">Anterior</span>
                  {/* Simple chevron using text */}
                  ‹
                </button>
                <button onClick={nextImg} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow">
                  <span className="sr-only">Siguiente</span>
                  ›
                </button>
              </>
            )}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {destination.images.map((_, idx) => (
                <span key={idx} className={`h-2 w-2 rounded-full ${idx === currentImage ? "bg-white" : "bg-white/50"}`} />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-slate-600">Sin imágenes disponibles.</div>
        )}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-semibold"><ThermometerSun className="w-4 h-4" /> Clima</div>
            <div className="text-slate-600">{destination.climate || "No especificado"}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-semibold"><Info className="w-4 h-4" /> Rango de costos</div>
            <div className="text-slate-600">{destination.costRange || "N/D"}</div>
          </div>
          <div>
            <div className="text-slate-900 font-semibold">Actividades</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {(destination.activities || []).slice(0, 6).map((a) => (
                <span key={a} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{a}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de presupuesto */}
      {tripPaid ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-2 text-slate-900 font-semibold"><Info className="w-4 h-4" /> Este viaje ya fue pagado</div>
          <div className="text-slate-600">Consulta el registro en <span className="font-medium">Pagos</span> o en <span className="font-medium">Historial</span>. Las acciones de presupuesto y pago se ocultan.</div>
          <div className="mt-4">
            <button onClick={eliminarPagoDestino} disabled={deletingTrip} className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 disabled:opacity-50">
              <Trash2 className="w-4 h-4" /> {deletingTrip ? "Eliminando…" : "Eliminar pago del destino"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-600">Origen</label>
            <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Ciudad, País" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Viajeros</label>
            <input type="number" min={1} value={travelers} onChange={(e) => setTravelers(parseInt(e.target.value || "1"))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Noches</label>
            <input type="number" min={1} value={nights} onChange={(e) => setNights(parseInt(e.target.value || "1"))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Clase de vuelo</label>
            <select value={travelClass} onChange={(e) => setTravelClass(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="economy">Económica</option>
              <option value="business">Business</option>
              <option value="first">Primera</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600">Habitaciones</label>
            <input type="number" min={1} value={rooms} onChange={(e) => setRooms(parseInt(e.target.value || "1"))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Hotel (opcional)</label>
            <select value={selectedHotel} onChange={(e) => setSelectedHotel(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Sin hotel</option>
              {((data?.hotels || []).filter((h) => !paidHotels.includes(h.name))).map((h) => (
                <option key={h.name} value={h.name}>{h.name} — {h.pricePerNight?.USD?.toLocaleString(undefined,{style:"currency",currency:"USD"})}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={calcularPresupuesto} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white font-semibold px-4 py-2">
            <Calculator className="w-4 h-4" /> Calcular presupuesto
          </button>
          <button onClick={pagarViaje} disabled={!budget} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 disabled:opacity-50">
            <DollarSign className="w-4 h-4" /> Pagar viaje
          </button>
        </div>
        {budget && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-slate-500">Vuelo</div>
              <div className="text-slate-900 font-semibold">{budget.flight.toLocaleString(undefined,{style:"currency",currency:"USD"})}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-slate-500">Alojamiento</div>
              <div className="text-slate-900 font-semibold">{budget.lodging.toLocaleString(undefined,{style:"currency",currency:"USD"})}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-slate-500">Total</div>
              <div className="text-slate-900 font-semibold">{budget.total.toLocaleString(undefined,{style:"currency",currency:"USD"})}</div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Hoteles (con imágenes) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Hotel className="w-5 h-5 text-slate-700" />
          <div className="text-slate-900 font-semibold">Hoteles disponibles</div>
        </div>
        {((data?.hotels || []).filter((h) => !paidHotels.includes(h.name))).length === 0 ? (
          <div className="text-slate-600">No hay hoteles para este destino.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {((data?.hotels || []).filter((h) => !paidHotels.includes(h.name))).map((h) => (
              <div key={h.name} className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="relative w-full h-40">
                  <Image src={(h.images && h.images[0]) || "/globe.svg"} alt={h.name} fill sizes="50vw" className="object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">{h.name}</div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4" /> <span className="text-sm">{h.stars}★</span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">{h.address}</div>
                  <div className="mt-2 text-slate-700">Precio/noche: {h.pricePerNight?.USD?.toLocaleString(undefined,{style:"currency",currency:"USD"})}</div>
                  <div className="mt-2 text-slate-600 text-sm">Servicios: {(h.amenities || []).slice(0,3).join(", ")}</div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setSelectedHotel(h.name)} className="rounded-lg bg-slate-100 text-slate-900 font-semibold px-3 py-2">Usar en presupuesto</button>
                    <button onClick={() => reservar(h.name)} className="rounded-lg bg-slate-900 text-white font-semibold px-3 py-2">Reservar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reservas pendientes (agendadas) */}
      {pendingBookings.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hotel className="w-5 h-5 text-slate-700" />
            <div className="text-slate-900 font-semibold">Reservas pendientes</div>
          </div>
          <div className="divide-y divide-slate-200">
            {pendingBookings
              .filter((p) => !destination || p.destination === destination.name)
              .map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-slate-900 font-medium">{p.hotel}</div>
                    <div className="text-sm text-slate-600">{p.destination}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => reservar(p.hotel)} className="rounded-lg bg-slate-900 text-white font-semibold px-3 py-2">Continuar</button>
                    <button
                      onClick={() => {
                        try {
                          const rawList = localStorage.getItem("sv_pending_bookings");
                          const list = rawList ? JSON.parse(rawList) : [];
                          const updated = list.filter((x: any) => x?.id !== p.id);
                          localStorage.setItem("sv_pending_bookings", JSON.stringify(updated));
                          setPendingBookings(updated);
                        } catch {}
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-2"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}