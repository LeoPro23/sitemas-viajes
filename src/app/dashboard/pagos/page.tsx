"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Hotel, Plane } from "lucide-react";

type PaymentItem = {
  type: "trip" | "hotel";
  ref?: string;
  destination?: string;
  hotel?: string;
  amountUSD?: number;
  nights?: number;
  date?: number;
};

export default function PaymentsSection() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);

  useEffect(() => {
    // Limpiar datos locales legacy y cargar exclusivamente desde la base
    (async () => {
      try {
        localStorage.removeItem("sv_payments");
        localStorage.removeItem("sv_trip_paid");
        localStorage.removeItem("sv_confirmation");
      } catch {}
      try {
        const rawUser = localStorage.getItem("sv_user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        const url = user?.email ? `/api/payments?email=${encodeURIComponent(user.email)}` : `/api/payments`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          const items = (j?.items || []).map((r: any) => ({
            type: r.type === "trip" ? "trip" : "hotel",
            ref: r.ref,
            destination: r.destination,
            hotel: r.hotel,
            amountUSD: typeof r.amount_usd === "number" ? r.amount_usd : Number(r.amount_usd),
            nights: r.nights,
            date: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
          })) as PaymentItem[];
          setPayments(items);
        }
      } catch {}
    })();
  }, []);

  const list = payments;

  const currency = (n?: number) =>
    typeof n === "number" ? n.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "-";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-900">Pagos</h1>
      </div>
      <p className="text-slate-600">Historial de pagos de viaje y reservas de hotel.</p>

      {list.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-slate-700">Aún no hay pagos registrados.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/pago" className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 transition">
              <Plane className="w-4 h-4" />
              Pagar viaje
            </Link>
            <Link href="/reserva" className="inline-flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-4 py-2 transition">
              <Hotel className="w-4 h-4" />
              Reservar hotel
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-200">
            {list.map((p, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {p.type === "trip" ? (
                    <Plane className="w-4 h-4 text-slate-600" />
                  ) : (
                    <Hotel className="w-4 h-4 text-slate-600" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-900">
                      {p.type === "trip" ? "Pago de viaje" : "Reserva de hotel"}
                    </div>
                    <div className="text-sm text-slate-600">
                      Ref: {p.ref || "-"} • Destino: {p.destination || "-"}
                      {p.hotel ? ` • Hotel: ${p.hotel}` : ""}
                      {typeof p.nights === "number" ? ` • Noches: ${p.nights}` : ""}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{currency(p.amountUSD)}</div>
                  <div className="text-xs text-slate-500">{p.date ? new Date(p.date).toLocaleString() : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}