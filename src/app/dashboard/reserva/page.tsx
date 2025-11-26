"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CreditCard, Calendar, Users, CheckCircle, Trash2, Star } from "lucide-react";

type BookingData = {
  destination: string;
  coordinates?: { lat: number; lon: number };
  hotel: {
    name: string;
    stars: number;
    address: string;
    pricePerNight: Record<string, number>;
    images: string[];
    amenities: string[];
    rating: number;
    bookingUrl: string;
  };
};

function DashboardReservaContent() {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [resultsData, setResultsData] = useState<any | null>(null);
  const [pendingBookings, setPendingBookings] = useState<Array<{ id: string; destination: string; hotel: string; amountUSD: number; createdAt: number }>>([]);
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [guests, setGuests] = useState<number>(2);
  const [processing, setProcessing] = useState(false);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [alreadyPaid, setAlreadyPaid] = useState<boolean>(false);
  const [tripPaid, setTripPaid] = useState<boolean>(false);
  const [deletingReservation, setDeletingReservation] = useState<boolean>(false);
  const [deletingTripPayment, setDeletingTripPayment] = useState<boolean>(false);
  const [deletingPendingReservation, setDeletingPendingReservation] = useState<boolean>(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sv_user");
      if (!raw) router.replace("/login");
    } catch {}
  }, [router]);

  useEffect(() => {
    try {
      const dest = searchParams.get("dest");
      const hotelName = searchParams.get("hotel");
      if (dest && hotelName) {
        const r = localStorage.getItem("sv_results");
        if (r) {
          const data = JSON.parse(r);
          setResultsData(data);
          const hotel = (data?.hotels || []).find((h: any) => h.name === hotelName);
          if (hotel) {
            setBooking({ destination: dest, coordinates: data?.destination?.coordinates, hotel });
            try {
              const current = { destination: dest, hotel: hotel.name };
              const rawList = localStorage.getItem("sv_pending_bookings");
              const list = rawList ? JSON.parse(rawList) : [];
              const id = `${current.destination}||${current.hotel}`;
              if (!list.some((x: any) => x?.id === id)) {
                const item = { id, destination: current.destination, hotel: current.hotel, amountUSD: 0, createdAt: Date.now() };
                const updated = [...list, item];
                localStorage.setItem("sv_pending_bookings", JSON.stringify(updated));
                setPendingBookings(updated);
              } else {
                setPendingBookings(list);
              }
            } catch {}
            return;
          }
        }
      }
    } catch {}
    // Fallback legacy
    try {
      const raw = localStorage.getItem("sv_booking");
      if (raw) setBooking(JSON.parse(raw));
    } catch {}
    try {
      const rawList = localStorage.getItem("sv_pending_bookings");
      setPendingBookings(rawList ? JSON.parse(rawList) : []);
    } catch {}
    try {
      const r = localStorage.getItem("sv_results");
      if (r) setResultsData(JSON.parse(r));
    } catch {}
  }, [searchParams]);

  // Verificar si el hotel ya fue pagado para este destino y usuario
  useEffect(() => {
    (async () => {
      if (!booking) return;
      try {
        const rawUser = localStorage.getItem("sv_user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        const url = user?.email ? `/api/payments?email=${encodeURIComponent(user.email)}` : `/api/payments`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          const items = Array.isArray(j?.items) ? j.items : [];
          const normalize = (s: any) => { try { return decodeURIComponent(String(s)); } catch { return String(s); } };
          const isPaid = items.some((r: any) => (r.type === "hotel" || r.type === "HOTEL") && normalize(r.destination) === normalize(booking.destination) && String(r.hotel) === booking.hotel.name);
          setAlreadyPaid(Boolean(isPaid));
        }
      } catch {}
    })();
  }, [booking]);

  // Persistir la reserva actual como pendiente en localStorage al cambiar
  useEffect(() => {
    if (!booking) return;
    try {
      localStorage.setItem("sv_booking", JSON.stringify(booking));
    } catch {}
    try {
      const id = `${booking.destination}||${booking.hotel.name}`;
      const rawList = localStorage.getItem("sv_pending_bookings");
      const list: Array<{ id: string; destination: string; hotel: string; amountUSD: number; createdAt: number }> = rawList ? JSON.parse(rawList) : [];
      if (!list.some((x) => x.id === id)) {
        const item = { id, destination: booking.destination, hotel: booking.hotel.name, amountUSD: 0, createdAt: Date.now() };
        const updated = [...list, item];
        localStorage.setItem("sv_pending_bookings", JSON.stringify(updated));
        setPendingBookings(updated);
      } else {
        setPendingBookings(list);
      }
    } catch {}
  }, [booking]);

  // Verificar si el destino ya fue pagado (pago de viaje) para este usuario
  useEffect(() => {
    (async () => {
      if (!booking) return;
      try {
        const rawUser = localStorage.getItem("sv_user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        const url = user?.email ? `/api/payments?email=${encodeURIComponent(user.email)}` : `/api/payments`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          const items = Array.isArray(j?.items) ? j.items : [];
          const normalize = (s: any) => { try { return decodeURIComponent(String(s)); } catch { return String(s); } };
          const isTripPaid = items.some((r: any) => (r.type === "trip" || r.type === "TRIP") && normalize(r.destination) === normalize(booking.destination));
          setTripPaid(Boolean(isTripPaid));
        }
      } catch {}
    })();
  }, [booking]);

  const nights = (() => {
    if (!checkIn || !checkOut) return 1;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const ms = outDate.getTime() - inDate.getTime();
    const d = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
    return d;
  })();

  const totalUSD = (() => {
    const price = booking?.hotel?.pricePerNight?.USD || 0;
    return Math.max(0, price * nights);
  })();

  const pagar = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      const confirmation = {
        id: `RSV-${Date.now()}`,
        destination: booking.destination,
        hotel: booking.hotel.name,
        amountUSD: totalUSD,
        nights,
        guests,
        checkIn,
        checkOut,
      };
      // Persistir en DB: reserva y pago de hotel
      try {
        const rawUser = localStorage.getItem("sv_user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        await fetch("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ref: confirmation.id,
            userEmail: user?.email || null,
            destination: confirmation.destination,
            hotel: confirmation.hotel,
            amountUSD: confirmation.amountUSD,
            nights: confirmation.nights,
            guests: confirmation.guests,
            checkIn: confirmation.checkIn,
            checkOut: confirmation.checkOut,
          }),
        });
        await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "hotel",
            ref: confirmation.id,
            userEmail: user?.email || null,
            destination: confirmation.destination,
            hotel: confirmation.hotel,
            amountUSD: confirmation.amountUSD,
            nights: confirmation.nights,
          }),
        });
      } catch (e) {
        console.warn("No se pudo guardar reserva/pago en DB", e);
      }
      setConfirmedId(confirmation.id);
      // Al confirmar, remover de pendientes
      try {
        const id = `${booking.destination}||${booking.hotel.name}`;
        const rawList = localStorage.getItem("sv_pending_bookings");
        const list = rawList ? JSON.parse(rawList) : [];
        const updated = list.filter((x: any) => x?.id !== id);
        localStorage.setItem("sv_pending_bookings", JSON.stringify(updated));
        setPendingBookings(updated);
        localStorage.removeItem("sv_booking");
      } catch {}
    } catch {}
    setProcessing(false);
  };

  const continuarReserva = (dest: string, hotelName: string) => {
    try {
      const destEnc = encodeURIComponent(dest);
      const hEnc = encodeURIComponent(hotelName);
      router.push(`/dashboard/reserva?dest=${destEnc}&hotel=${hEnc}`);
    } catch {}
  };

  const eliminarReservaHotel = async () => {
    if (!booking) return;
    setDeletingReservation(true);
    try {
      const rawUser = localStorage.getItem("sv_user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      await fetch("/api/booking", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user?.email || null, destination: booking.destination, hotel: booking.hotel.name }),
      });
      await fetch("/api/payments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "hotel", userEmail: user?.email || null, destination: booking.destination, hotel: booking.hotel.name }),
      });
      setAlreadyPaid(false);
      setConfirmedId(null);
    } catch {}
    setDeletingReservation(false);
  };

  const eliminarPagoDestino = async () => {
    if (!booking) return;
    setDeletingTripPayment(true);
    try {
      const rawUser = localStorage.getItem("sv_user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      await fetch("/api/payments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "trip", userEmail: user?.email || null, destination: booking.destination }),
      });
      setTripPaid(false);
    } catch {}
    setDeletingTripPayment(false);
  };

  const eliminarPagoPendienteReserva = async () => {
    if (!booking) return;
    setDeletingPendingReservation(true);
    try {
      try { localStorage.removeItem("sv_booking"); } catch {}
      try {
        const id = `${booking.destination}||${booking.hotel.name}`;
        const rawList = localStorage.getItem("sv_pending_bookings");
        const list = rawList ? JSON.parse(rawList) : [];
        const updated = list.filter((x: any) => x?.id !== id);
        localStorage.setItem("sv_pending_bookings", JSON.stringify(updated));
        setPendingBookings(updated);
      } catch {}
      setBooking(null);
    } catch {}
    setDeletingPendingReservation(false);
  };

  if (!booking) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="text-slate-900 font-semibold text-lg">No hay reserva seleccionada</div>
        <div className="text-slate-600 mt-1">Elige un hotel desde Resultados o el detalle del destino.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Confirmar reserva</h1>
      {alreadyPaid ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div className="text-slate-900 font-semibold">No hay pagos de reserva de hotel pendientes</div>
          </div>
          <div className="text-sm text-slate-600">La reserva en {booking.hotel.name} para {booking.destination} ya está pagada. Revisa Pagos o Historial.</div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => router.push("/dashboard/pagos")} className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold">Ver pagos</button>
            <button onClick={() => router.push("/dashboard/destino")} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 font-semibold">Ir a destino</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                <Image src={booking.hotel.images[0] || "/globe.svg"} alt={booking.hotel.name} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-slate-500 mb-1">Destino</div>
                <h2 className="text-xl font-semibold text-slate-900">{booking.destination}</h2>
                <div className="text-sm text-slate-500 mt-2">Hotel</div>
                <div className="text-slate-900 font-medium">{booking.hotel.name}</div>
                <div className="text-sm text-slate-600">{booking.hotel.address}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Check-in</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Check-out</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Huéspedes</label>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <input type="number" min={1} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-sm text-slate-600">Total estimado</div>
              <div className="text-2xl font-bold text-slate-900">${totalUSD}</div>
              <div className="text-xs text-slate-500">{nights} {nights === 1 ? "noche" : "noches"} • {guests} {guests === 1 ? "huésped" : "huéspedes"}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Pago</h3>
            </div>

            <div className="space-y-3 mb-6">
              <input type="text" placeholder="Titular de la tarjeta" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none" />
              <input type="text" placeholder="Número de tarjeta" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="MM/AA" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none" />
                <input type="text" placeholder="CVV" className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none" />
              </div>
            </div>

            <button onClick={pagar} disabled={processing} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors">
              {processing ? "Procesando…" : "Pagar ahora"}
            </button>

            <button onClick={eliminarPagoPendienteReserva} disabled={deletingPendingReservation} className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50">
              <Trash2 className="w-4 h-4" /> {deletingPendingReservation ? "Eliminando…" : "Eliminar pago pendiente"}
            </button>
          
            {confirmedId && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-slate-900 font-semibold">Pago confirmado</div>
                  <div className="text-sm text-slate-600">ID de reserva: {confirmedId}</div>
                  <div className="mt-3">
                    <button onClick={() => router.push("/dashboard/pagos")} className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold">Ver pagos</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reservas pendientes acumuladas (tarjetas con imagen) */}
      {pendingBookings.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="text-slate-900 font-semibold mb-3">Reservas pendientes</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingBookings
              .filter((p) => !booking || p.destination === booking.destination)
              .map((p) => {
                const h = (resultsData?.hotels || []).find((x: any) => x.name === p.hotel);
                if (h) {
                  return (
                    <div key={p.id} className="rounded-lg border border-slate-200 overflow-hidden">
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
                          <button onClick={() => continuarReserva(p.destination, p.hotel)} className="rounded-lg bg-slate-900 text-white font-semibold px-3 py-2">Continuar</button>
                          <button
                            onClick={() => {
                              try {
                                const rawList = localStorage.getItem("sv_pending_bookings");
                                const list = rawList ? JSON.parse(rawList) : [];
                                const updated = list.filter((x: any) => x?.id !== p.id);
                                localStorage.setItem("sv_pending_bookings", JSON.stringify(updated));
                                setPendingBookings(updated);
                                if (booking && `${booking.destination}||${booking.hotel.name}` === p.id) {
                                  localStorage.removeItem("sv_booking");
                                  setBooking(null);
                                }
                              } catch {}
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-2"
                          >
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
                // Fallback compacto si no hay detalles del hotel
                return (
                  <div key={p.id} className="rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                    <div>
                      <div className="text-slate-900 font-medium">{p.hotel}</div>
                      <div className="text-sm text-slate-600">{p.destination}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => continuarReserva(p.destination, p.hotel)} className="rounded-lg bg-slate-900 text-white font-semibold px-3 py-2">Continuar</button>
                      <button
                        onClick={() => {
                          try {
                            const rawList = localStorage.getItem("sv_pending_bookings");
                            const list = rawList ? JSON.parse(rawList) : [];
                            const updated = list.filter((x: any) => x?.id !== p.id);
                            localStorage.setItem("sv_pending_bookings", JSON.stringify(updated));
                            setPendingBookings(updated);
                            if (booking && `${booking.destination}||${booking.hotel.name}` === p.id) {
                              localStorage.removeItem("sv_booking");
                              setBooking(null);
                            }
                          } catch {}
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-2"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardReserva() {
  return (
    <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-8">Cargando reserva…</div>}>
      <DashboardReservaContent />
    </Suspense>
  );
}