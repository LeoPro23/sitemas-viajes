"use client";

import React, { useState, Suspense } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2, Globe } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

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

const steps = [
  { 
    key: "tripType", 
    label: "Tipo de viaje", 
    description: "Seleccione la categoría que mejor describa su experiencia deseada",
    options: [
      { id: "adventure", label: "Aventura", description: "Actividades dinámicas y emocionantes" },
      { id: "relax", label: "Relajación", description: "Descanso y tranquilidad" },
      { id: "cultural", label: "Cultural", description: "Historia, arte y tradiciones" },
      { id: "romantic", label: "Romántico", description: "Experiencias para parejas" },
      { id: "family", label: "Familiar", description: "Actividades para toda la familia" },
      { id: "gastronomic", label: "Gastronómico", description: "Experiencias culinarias" },
      { id: "ecotourism", label: "Ecoturismo", description: "Naturaleza sostenible" },
    ] 
  },
  { 
    key: "budget", 
    label: "Rango presupuestario",
    description: "Indique el nivel de inversión para su viaje",
    options: [
      { id: "economic", label: "Económico", description: "Opciones accesibles" },
      { id: "moderate", label: "Moderado", description: "Balance calidad-precio" },
      { id: "comfort", label: "Confort", description: "Servicios premium" },
      { id: "luxury", label: "Lujo", description: "Experiencias exclusivas" },
    ] 
  },
  { 
    key: "climate", 
    label: "Preferencia climática",
    description: "Seleccione el clima de su preferencia",
    options: [
      { id: "warm", label: "Playa / Calor", description: "Destinos tropicales" },
      { id: "cold", label: "Montaña / Frío", description: "Climas frescos" },
      { id: "temperate", label: "Templado", description: "Clima moderado" },
      { id: "any", label: "Indiferente", description: "Sin preferencia" },
    ] 
  },
  { 
    key: "duration", 
    label: "Duración del viaje",
    description: "Tiempo estimado de su estancia",
    options: [
      { id: "weekend", label: "Fin de semana", description: "2-3 días" },
      { id: "weekly", label: "Semanal", description: "4-7 días" },
      { id: "extended", label: "Extendido", description: "8+ días" },
    ] 
  },
  { 
    key: "activities", 
    label: "Actividades de interés",
    description: "Seleccione una o múltiples opciones",
    multi: true, 
    options: [
      { id: "extreme", label: "Deportes extremos", description: "Adrenalina" },
      { id: "history", label: "Museos / Historia", description: "Cultura" },
      { id: "nature", label: "Naturaleza", description: "Aire libre" },
      { id: "nightlife", label: "Vida nocturna", description: "Entretenimiento" },
      { id: "gastronomy", label: "Gastronomía", description: "Experiencias culinarias" },
      { id: "shopping", label: "Shopping", description: "Compras" },
    ] 
  },
  { 
    key: "lodging", 
    label: "Tipo de hospedaje",
    description: "Seleccione su preferencia de alojamiento",
    options: [
      { id: "hotel", label: "Hotel", description: "Servicios estándar" },
      { id: "resort", label: "Resort", description: "Todo incluido" },
      { id: "hostel", label: "Hostal", description: "Económico y social" },
      { id: "airbnb", label: "Airbnb", description: "Experiencia local" },
      { id: "boutique", label: "Boutique", description: "Exclusivo y único" },
    ] 
  },
  { 
    key: "company", 
    label: "Compañía de viaje",
    description: "Con quién realizará el viaje",
    options: [
      { id: "solo", label: "Solo", description: "Viajero individual" },
      { id: "couple", label: "Pareja", description: "Dos personas" },
      { id: "family_kids", label: "Familia con niños", description: "Grupo familiar" },
      { id: "friends", label: "Amigos", description: "Grupo de amigos" },
      { id: "group", label: "Grupo grande", description: "Varios viajeros" },
    ] 
  },
  { 
    key: "season", 
    label: "Flexibilidad de fechas",
    description: "Disponibilidad temporal",
    options: [
      { id: "specific", label: "Fechas específicas", description: "Periodo definido" },
      { id: "flexible", label: "Fechas flexibles", description: "Sin restricción" },
    ] 
  },
];

function QuestionnaireContent() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ activities: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const embedded = (searchParams?.get("embed") === "1");
  const [submitted, setSubmitted] = useState(false);

  // En modo embebido, reporta la altura al padre para ajustar el iframe
  React.useEffect(() => {
    if (!embedded) return;
    const sendHeight = () => {
      try {
        const h = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight
        );
        // Notifica al contenedor del dashboard
        window.parent?.postMessage({ type: "questionnaireHeight", height: h }, "*");
      } catch {}
    };
    sendHeight();
    const ro = new ResizeObserver(() => sendHeight());
    try { ro.observe(document.body); } catch {}
    const onLoad = () => sendHeight();
    window.addEventListener("load", onLoad);
    const onResize = () => sendHeight();
    window.addEventListener("resize", onResize);
    return () => {
      try { ro.disconnect(); } catch {}
      window.removeEventListener("load", onLoad);
      window.removeEventListener("resize", onResize);
    };
  }, [embedded]);

  const current = steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  const updateAnswer = (id: string) => {
    if (current.multi) {
      const list = new Set(answers.activities || []);
      list.has(id) ? list.delete(id) : list.add(id);
      setAnswers({ ...answers, activities: Array.from(list) });
    } else {
      setAnswers({ ...answers, [current.key]: id });
      if (stepIndex < steps.length - 1) {
        setTimeout(() => {
          setStepIndex((i) => Math.min(i + 1, steps.length - 1));
        }, 200);
      }
    }
  };

  const canContinue = () => {
    if (current.multi) return (answers.activities || []).length > 0;
    return Boolean((answers as any)[current.key]);
  };

  const next = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setStepIndex((i) => Math.max(i - 1, 0));

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPreferences: answers }),
      });
      const data = await res.json();
      // Persistir resultados y navegar a la página de resultados
      try {
        localStorage.setItem("sv_results", JSON.stringify(data));
        // Guardar historial con respuestas
        const rawH = localStorage.getItem("sv_results_history");
        const history = rawH ? JSON.parse(rawH) : [];
        history.push({ date: Date.now(), destination: data?.destination?.name, answers });
        localStorage.setItem("sv_results_history", JSON.stringify(history));
        // Persistir en base de datos
        try {
          const rawUser = localStorage.getItem("sv_user");
          const user = rawUser ? JSON.parse(rawUser) : null;
          await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: user?.email || null,
              destinationName: data?.destination?.name || null,
              answers,
              resultSnapshot: data,
            }),
          });
        } catch (e) {
          console.warn("No se pudo guardar historial en DB", e);
        }
      } catch {}
      if (embedded) {
        setSubmitted(true);
        // Solicitar al contenedor del dashboard que navegue automáticamente a Destino
        try {
          window.parent?.postMessage({ type: "questionnaireNavigate", path: "/dashboard/destino" }, "*");
        } catch {}
      } else {
        router.push("/dashboard/destino");
      }
    } catch (err) {
      console.error(err);
      alert("Error al procesar la recomendación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header (oculto en modo embebido) */}
      {!embedded && (
        <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900">TravelSmart</span>
            </div>
            <div className="text-sm font-medium text-slate-600">
              Cuestionario de preferencias
            </div>
          </div>
        </header>
      )}

      <div className={`mx-auto ${embedded ? "max-w-5xl w-full px-4 py-6" : "max-w-4xl px-6 py-12"}`}>
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Análisis de preferencias de viaje
          </h1>
          <p className="text-lg text-slate-600">
            Complete el cuestionario estructurado para recibir recomendaciones personalizadas basadas en sus preferencias.
          </p>
        </div>

        {embedded && submitted && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            ¡Listo! Tus respuestas se han guardado y se generó una recomendación.
            Revisa el destino recomendado en el apartado "Destino" del dashboard y
            consulta el historial en "Historial".
          </div>
        )}

        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-900">
              Paso {stepIndex + 1} de {steps.length}
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {progress}% completado
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-slate-900 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {steps.map((step, idx) => (
            <button
              key={step.key}
              onClick={() => setStepIndex(idx)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                idx === stepIndex
                  ? 'bg-slate-900 text-white'
                  : idx < stepIndex
                  ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  : 'bg-white text-slate-400 border border-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                {idx < stepIndex && <Check className="w-4 h-4" />}
                {step.label}
              </span>
            </button>
          ))}
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {current.label}
            </h2>
            <p className="text-slate-600">
              {current.description}
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {current.options.map((opt) => {
              const selected = current.multi
                ? (answers.activities || []).includes(opt.id)
                : (answers as any)[current.key] === opt.id;
              
              return (
                <button
                  key={opt.id}
                  onClick={() => updateAnswer(opt.id)}
                  className={`group relative rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                    selected
                      ? 'border-slate-900 bg-slate-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {opt.label}
                    </h3>
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected
                        ? 'border-slate-900 bg-slate-900'
                        : 'border-slate-300 group-hover:border-slate-400'
                    }`}>
                      {selected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">
                    {opt.description}
                  </p>
                </button>
              );
            })}
          </div>

          {current.multi && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600">
                <strong className="text-slate-900">{(answers.activities || []).length}</strong> actividad(es) seleccionada(s)
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            disabled={stepIndex === 0}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-slate-200 bg-white text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          {stepIndex < steps.length - 1 ? (
            current.multi ? (
              <button
                onClick={next}
                disabled={!canContinue()}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="text-sm text-slate-500">
                Avance automático al seleccionar
              </div>
            )
          ) : (
            <button
              onClick={submit}
              disabled={!canContinue() || loading}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando análisis...
                </>
              ) : (
                <>
                  Generar recomendación
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-1">
                Proceso seguro y confidencial
              </h4>
              <p className="text-sm text-slate-600">
                Sus respuestas se procesan mediante algoritmos avanzados para generar recomendaciones precisas. 
                La información no se almacena ni comparte con terceros.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuestionnairePage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-600">Cargando cuestionario...</div>}>
      <QuestionnaireContent />
    </Suspense>
  );
}