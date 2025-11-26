Sistema Experto de Recomendación de Viajes (Frontend)

Este proyecto implementa el frontend del sistema descrito en `doc.doc`. Incluye:
- Landing page con CTA “Comenzar”.
- Cuestionario multi‑paso con barra de progreso.
- API `/api/recommend` que reenvía al webhook de n8n y ofrece fallback local con reglas.
- Página de resultados con carrusel, alternativas y tarjetas de hoteles.

Requisitos
- Node.js 18.x

Instalación
```bash
npm install
npm run dev
```
Abrir `http://localhost:3000`.

Variables de entorno
- `N8N_WEBHOOK_URL` (servidor) o `NEXT_PUBLIC_N8N_WEBHOOK_URL` (cliente) apuntando al Webhook en n8n.
- `RECOMMEND_USE_WEBHOOK`: `true` para usar n8n; `false` (por defecto) para usar la lógica local.
- Claves opcionales de APIs (si se usan desde n8n): Amadeus, Unsplash, OpenWeather, etc.

Estructura relevante
- `src/app/questionnaire/page.tsx`: formulario de preferencias.
- `src/app/api/recommend/route.ts`: proxy al webhook y fallback.
- `src/app/results/page.tsx`: visualización de recomendaciones y hoteles.
- `config/`: base de destinos y reglas.
- `workflows/main-workflow.json`: skeleton del workflow n8n.

Workflow n8n
Importa `workflows/main-workflow.json` en n8n, añade credenciales y ajusta nodos HTTP para imágenes, clima y hoteles.
