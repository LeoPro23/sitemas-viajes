"use client";
import Link from "next/link";
import { Compass, ExternalLink } from "lucide-react";

export default function RecommendationSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Compass className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-semibold text-slate-900">Formulario de recomendación</h1>
      </div>
      <p className="text-slate-600">
        Accede al formulario para generar recomendaciones personalizadas y ver resultados.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/questionnaire" className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 transition">
          <ExternalLink className="w-4 h-4" />
          Abrir formulario
        </Link>
        <Link href="/dashboard/results" className="inline-flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-4 py-2 transition">
          Ver resultados
        </Link>
      </div>
    </div>
  );
}