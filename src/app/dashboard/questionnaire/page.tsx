"use client";
import React, { useEffect, useRef, useState } from "react";

export default function DashboardQuestionnairePage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(700);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        // Navegación solicitada por el cuestionario embebido
        if (typeof e.data === "object" && e.data?.type === "questionnaireNavigate" && typeof e.data.path === "string") {
          try {
            window.location.href = e.data.path;
          } catch {}
          return;
        }
        // Ajuste de altura del iframe
        if (typeof e.data === "object" && e.data?.type === "questionnaireHeight") {
          const h = Number(e.data.height) || iframeHeight;
          const minH = Math.max(h, window.innerHeight - 140);
          setIframeHeight(minH);
          if (iframeRef.current) iframeRef.current.style.height = `${minH}px`;
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [iframeHeight]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Cuestionario</h1>
      <p className="text-sm text-slate-600">Completa el formulario de preferencias para generar tus recomendaciones.</p>
      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
        <iframe
          ref={iframeRef}
          src="/questionnaire?embed=1"
          className="w-full border-0"
          style={{ height: iframeHeight }}
          title="Cuestionario"
        />
      </div>
    </div>
  );
}