"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CreditCard, CheckCircle, MapPin, Trash2 } from "lucide-react";

type TripPayload = {
  origin: string;
  destinationName: string;
  destinationCountry: string;
  coordinates?: { lat: number; lon: number };
  travellers: number;
  nights: number;
  travelClass: "economy" | "business";
  hotel: { name: string; pricePerNight: number } | null;
  rooms: number;
  breakdown: {
    distanceKm: number;
    flight: { total: number; class: string };
    daily: { perDay: number; total: number };
    lodging: { perNight: number; rooms: number; nights: number; total: number };
    total: number;
    perPerson: number;
  };
};

function DashboardPagoContent() {
  const router = useRouter();
  const [trip, setTrip] = useState<TripPayload | null>(null);
  const [alreadyPaid, setAlreadyPaid] = useState<boolean>(false);
  const [budgetRef, setBudgetRef] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const [ref, setRef] = useState<string>("");
  const [deletingPendingBudget, setDeletingPendingBudget] = useState<boolean>(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sv_user");
      if (!raw) router.replace("/login");
    } catch {}
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        // Cargar presupuesto desde DB por ref (si existe) o último del usuario
        const rawUser = localStorage.getItem("sv_user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        const refParam = searchParams.get("ref");
        const url = refParam
          ? `/api/trip-budget?${user?.email ? `email=${encodeURIComponent(user.email)}&` : ""}ref=${encodeURIComponent(refParam)}`
          : (user?.email ? `/api/trip-budget?email=${encodeURIComponent(user.email)}` : `/api/trip-budget`);
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          const item = (j?.items || [])[0];
          if (item) {
            setBudgetRef(item.ref || null);
            const bp = item.breakdown || {};
            const hotelObj = item.hotel || null;
            const payload: TripPayload = {
              origin: item.origin || "",
              destinationName: item.destination_name || "",
              destinationCountry: item.destination_country || "",
              coordinates: undefined,
              travellers: Number(item.travellers) || 1,
              nights: Number(item.nights) || 1,
              travelClass: (item.travel_class || "economy") as any,
              hotel: hotelObj ? { name: hotelObj.name, pricePerNight: hotelObj.pricePerNight || 0 } : null,
              rooms: Number(item.rooms) || 1,
              breakdown: {
                distanceKm: Number(bp.distanceKm) || 0,
                flight: { total: Number(bp?.flight?.total ?? bp.flight ?? 0), class: String(item.travel_class || "economy") },
                daily: { perDay: Number(bp?.daily?.perDay ?? bp.daily ?? 0), total: Number(bp?.daily?.total ?? bp.daily ?? 0) },
                lodging: { perNight: Number(bp?.lodging?.perNight ?? 0), rooms: Number(item.rooms) || 1, nights: Number(item.nights) || 1, total: Number(bp?.lodging?.total ?? bp.lodging ?? 0) },
                total: Number(bp.total ?? 0),
                perPerson: Number(bp.perPerson ?? 0),
              },
            };
            setTrip(payload);

            // Verificar si el viaje ya está pagado para ocultar el formulario
            try {
              const destLabel = `${item.destination_name || ""}, ${item.destination_country || ""}`;
              const urlPayments = user?.email ? `/api/payments?email=${encodeURIComponent(user.email)}` : `/api/payments`;
              const resPayments = await fetch(urlPayments, { cache: "no-store" });
              if (resPayments.ok) {
                const pj = await resPayments.json();
                const itemsP = Array.isArray(pj?.items) ? pj.items : [];
                const normalize = (s: any) => { try { return decodeURIComponent(String(s)); } catch { return String(s); } };
                const isTripPaid = itemsP.some((r: any) => (r.type === "trip" || r.type === "TRIP") && normalize(r.destination) === destLabel);
                setAlreadyPaid(Boolean(isTripPaid));
              }
            } catch {}
          }
        }
      } catch (e) {
        console.warn("No se pudo cargar presupuesto desde DB", e);
      }
    })();
  }, [searchParams]);

  const pay = async () => {
    if (!trip) return;
    setStatus("processing");
    setTimeout(() => {
      const code = `TS-${Date.now().toString().slice(-8)}`;
      setRef(code);
      try {
        const destLabel = `${trip.destinationName}, ${trip.destinationCountry}`;
        // Persistir en DB pago de viaje exclusivamente
        try {
          const rawUser = localStorage.getItem("sv_user");
          const user = rawUser ? JSON.parse(rawUser) : null;
          fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "trip",
              ref: code,
              userEmail: user?.email || null,
              destination: destLabel,
              hotel: trip.hotel?.name || null,
              amountUSD: trip.breakdown.total,
              nights: trip.nights,
            }),
          }).catch(() => {});
        } catch (e) {
          console.warn("No se pudo guardar pago de viaje en DB", e);
        }
      } catch {}
      setStatus("success");
    }, 1000);
  };

  if (!trip) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="text-slate-900 font-semibold text-lg">Sin presupuesto cargado</div>
        <div className="text-slate-600 mt-1">Calcula el presupuesto desde el detalle del destino.</div>
      </div>
    );
  }

  const destLabel = `${trip.destinationName}, ${trip.destinationCountry}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Pagar viaje</h1>
      {alreadyPaid ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div className="text-slate-900 font-semibold">No hay pagos de destinos pendientes</div>
          </div>
          <div className="text-sm text-slate-600">El viaje a {destLabel} ya está pagado. Revisa Pagos o Historial.</div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => router.push("/dashboard/pagos")} className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold">Ver pagos</button>
            <button onClick={() => router.push("/dashboard/destino")} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 font-semibold">Ir a destino</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumen del presupuesto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-sm text-slate-600">
                <div className="font-medium text-slate-900">Origen</div>
                <div>{trip.origin}</div>
              </div>
              <div className="text-sm text-slate-600">
                <div className="font-medium text-slate-900">Destino</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{destLabel}</div>
              </div>
              <div className="text-sm text-slate-600">
                <div className="font-medium text-slate-900">Viajeros</div>
                <div>{trip.travellers}</div>
              </div>
              <div className="text-sm text-slate-600">
                <div className="font-medium text-slate-900">Noches</div>
                <div>{trip.nights}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200">
                <div className="text-sm text-slate-500">Vuelo ({trip.breakdown.flight.class})</div>
                <div className="text-xl font-semibold text-slate-900">${trip.breakdown.flight.total}</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200">
                <div className="text-sm text-slate-500">Gasto diario</div>
                <div className="text-xl font-semibold text-slate-900">${trip.breakdown.daily.total}</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200">
                <div className="text-sm text-slate-500">Hospedaje</div>
                <div className="text-xl font-semibold text-slate-900">${trip.breakdown.lodging.total}</div>
              </div>
            </div>
            <div className="mt-6 p-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-emerald-700">Presupuesto total</div>
                  <div className="text-3xl font-bold text-emerald-800">${trip.breakdown.total}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-emerald-700">Por persona</div>
                  <div className="text-2xl font-bold text-emerald-800">${trip.breakdown.perPerson}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Datos de pago</h3>
            </div>
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              <input value={card} onChange={(e) => setCard(e.target.value)} placeholder="Número de tarjeta" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              <div className="grid grid-cols-2 gap-3">
                <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/AA" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                <input value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="CVV" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              </div>
              <button onClick={pay} disabled={status !== "idle"} className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${status === "idle" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-500 cursor-not-allowed"}`}>
                Confirmar pago
              </button>
              <button
                onClick={async () => {
                  setDeletingPendingBudget(true);
                  try {
                    const rawUser = localStorage.getItem("sv_user");
                    const user = rawUser ? JSON.parse(rawUser) : null;
                    await fetch("/api/trip-budget", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ref: budgetRef || null, userEmail: user?.email || null, destinationName: trip.destinationName, destinationCountry: trip.destinationCountry }),
                    });
                    setTrip(null);
                  } catch {}
                  setDeletingPendingBudget(false);
                }}
                disabled={deletingPendingBudget}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> {deletingPendingBudget ? "Eliminando…" : "Eliminar pago pendiente"}
              </button>
            </div>

            {status === "processing" && (
              <div className="mt-4 text-sm text-slate-600">Procesando pago…</div>
            )}

            {status === "success" && (
              <div className="mt-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle className="w-5 h-5" />
                  Pago confirmado
                </div>
                <div className="mt-2 text-slate-700 text-sm">Referencia: <span className="font-mono">{ref}</span></div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => router.push("/dashboard/pagos")} className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold">Ver pagos</button>
                  <button onClick={() => router.push("/dashboard/destino")} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 font-semibold">Explorar hoteles</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPago() {
  return (
    <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-8">Cargando pago…</div>}>
      <DashboardPagoContent />
    </Suspense>
  );
}