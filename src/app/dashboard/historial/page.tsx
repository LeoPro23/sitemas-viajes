"use client";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

type Answers = {
  tripType?: string;
  budget?: string;
  climate?: string;
  duration?: string;
  activities?: string[];
  lodging?: string;
  company?: string;
  season?: string;
};

type HistoryItem = {
  id?: number;
  date: number;
  destination?: string;
  answers?: Answers;
};

export default function DashboardHistorial() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    (async () => {
      let list: HistoryItem[] = [];
      // Limpieza de claves locales legacy
      try { localStorage.removeItem("sv_results_history"); } catch {}
      // Cargar desde DB
      try {
        const rawUser = localStorage.getItem("sv_user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        const url = user?.email ? `/api/history?email=${encodeURIComponent(user.email)}` : `/api/history`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          list = (j?.items || []).map((r: any) => ({
            id: typeof r.id === "number" ? r.id : undefined,
            date: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
            destination: r.destination_name || undefined,
            answers: r.answers || undefined,
          }));
        }
      } catch {}
      setItems(list.reverse());
    })();
  }, []);

  const label = (k: string) => {
    switch (k) {
      case "tripType": return "Tipo de viaje";
      case "budget": return "Presupuesto";
      case "climate": return "Clima";
      case "duration": return "Duración";
      case "lodging": return "Hospedaje";
      case "company": return "Compañía";
      case "season": return "Fechas";
      case "activities": return "Actividades";
      default: return k;
    }
  };

  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleClearAll = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      const rawUser = localStorage.getItem("sv_user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      const url = user?.email ? `/api/history?email=${encodeURIComponent(user.email)}` : `/api/history`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) setItems([]);
    } catch {}
    setClearing(false);
  };

  const handleDeleteOne = async (id?: number) => {
    if (!id || deletingId) return;
    setDeletingId(id);
    try {
      const rawUser = localStorage.getItem("sv_user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      const base = user?.email ? `/api/history?email=${encodeURIComponent(user.email)}` : `/api/history`;
      const url = `${base}&id=${encodeURIComponent(String(id))}`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {}
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-900">Historial de resultados</h1>
        <div className="ml-auto">
          <button
            onClick={handleClearAll}
            disabled={clearing || items.length === 0}
            className="px-3 py-2 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {clearing ? "Limpiando..." : "Limpiar historial"}
          </button>
        </div>
      </div>
      <p className="text-slate-600">Registros generados a partir de tus respuestas del cuestionario.</p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Aún no hay historial. Completa el cuestionario para generar recomendaciones.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-slate-900 font-semibold">{it.destination || "Destino recomendado"}</div>
                <div className="text-slate-500 text-sm">{new Date(it.date).toLocaleString()}</div>
              </div>
              <div className="mb-3">
                <button
                  onClick={() => handleDeleteOne(it.id)}
                  disabled={!it.id || deletingId === it.id}
                  className="px-2 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {deletingId === it.id ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
              {it.answers ? (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(it.answers).map(([k, v]) => (
                    <div key={k} className="text-sm text-slate-700">
                      <span className="text-slate-500">{label(k)}: </span>
                      {Array.isArray(v) ? v.join(", ") : v}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-600">Respuestas no disponibles para este registro.</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}