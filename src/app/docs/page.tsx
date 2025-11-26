export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold">Documentación del Sistema</h1>
      <p className="mt-2 text-slate-600">
        Este proyecto implementa el frontend del Sistema Experto de Recomendación de Viajes y se integra con n8n mediante un webhook.
      </p>

      <h2 className="mt-8 text-2xl font-semibold">Instalación</h2>
      <ul className="mt-3 list-disc pl-5 text-slate-700">
        <li>Clona el repositorio y entra a la carpeta del proyecto.</li>
        <li>Configura las variables de entorno siguiendo <code>.env.example</code>.</li>
        <li>Instala dependencias con <code>npm install</code>.</li>
        <li>Ejecuta <code>npm run dev</code> y abre <code>http://localhost:3000</code>.</li>
      </ul>

      <h2 className="mt-8 text-2xl font-semibold">Integración con n8n</h2>
      <p className="mt-2 text-slate-700">
        Para conectar el cuestionario con n8n, configura <code>N8N_WEBHOOK_URL</code> (o <code>NEXT_PUBLIC_N8N_WEBHOOK_URL</code>) apuntando al Webhook de tu workflow. El frontend enviará un POST a <code>/api/recommend</code> que reenvía al webhook.
      </p>
      <pre className="mt-4 rounded-lg bg-neutral p-4 text-sm">
{`POST /api/recommend
{
  "userPreferences": {
    "tripType": "cultural",
    "budget": "moderate",
    "climate": "temperate",
    "duration": "weekly",
    "activities": ["history","trekking"],
    "lodging": "hotel",
    "company": "couple",
    "season": "specific"
  }
}`}
      </pre>

      <h2 className="mt-8 text-2xl font-semibold">Archivos relevantes</h2>
      <ul className="mt-3 list-disc pl-5 text-slate-700">
        <li><code>src/app/questionnaire/page.tsx</code>: formulario multi‑paso.</li>
        <li><code>src/app/api/recommend/route.ts</code>: proxy al webhook y fallback.</li>
        <li><code>src/app/results/page.tsx</code>: visualización de resultados y hoteles.</li>
        <li><code>config/destinations-database.json</code>: base inicial de destinos.</li>
        <li><code>config/destinations-rules.json</code>: pesos del sistema experto.</li>
        <li><code>workflows/main-workflow.json</code>: skeleton del workflow n8n.</li>
      </ul>

      <h2 className="mt-8 text-2xl font-semibold">Siguientes pasos</h2>
      <ul className="mt-3 list-disc pl-5 text-slate-700">
        <li>Completar nodos HTTP en n8n para imágenes, clima y hoteles.</li>
        <li>Agregar credenciales en n8n y manejar errores con <code>try/catch</code>.</li>
        <li>Optimizar filtros y ordenamiento en la página de resultados.</li>
      </ul>
    </div>
  );
}