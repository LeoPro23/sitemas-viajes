"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Compass, CreditCard, FileBarChart } from "lucide-react";

export default function DashboardHome() {
  useEffect(() => {
    // Limpieza de claves locales para forzar uso de la base
    try {
      localStorage.removeItem("sv_payments");
      localStorage.removeItem("sv_trip_paid");
      localStorage.removeItem("sv_confirmation");
      localStorage.removeItem("sv_results_history");
      localStorage.removeItem("sv_trip_budget");
    } catch {}
  }, []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Panel principal</h1>
      <p className="text-slate-600">
        Usa el menú lateral para navegar. Aquí tienes accesos rápidos:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/recommendation" className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
            <div>
              <div className="font-semibold text-slate-900">Formulario de recomendación</div>
              <div className="text-sm text-slate-600">Configura tus preferencias y destinos</div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/pagos" className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
            <div>
              <div className="font-semibold text-slate-900">Pagos</div>
              <div className="text-sm text-slate-600">Resumen de pagos de viaje y hotel</div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/reportes" className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition">
          <div className="flex items-center gap-3">
            <FileBarChart className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
            <div>
              <div className="font-semibold text-slate-900">Reportes</div>
              <div className="text-sm text-slate-600">Métricas y totales por categoría</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}