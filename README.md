Sistema Experto de Recomendación de Viajes (Frontend)

Este proyecto implementa el frontend del sistema descrito en `doc.doc`. Incluye:
- Landing page con CTA “Comenzar”.
- Cuestionario multi‑paso con barra de progreso.
- API `/api/recommend` que reenvía al webhook de n8n y ofrece fallback local con reglas.
- Página de resultados con carrusel, alternativas y tarjetas de hoteles.

Requisitos
- Node.js 18.x
- Postgres 12+ (opcional; requerido para /api/history, /api/trip-budget, /api/booking, /api/payments)

Configuracion
1. Crea un archivo `.env` (gitignored) y completa las variables indicadas abajo.
2. Si usas n8n, importa `workflows/main-workflow.json`, crea el webhook y ajusta credenciales.
3. Si usas Postgres, crea la base/usuario; las tablas se crean al primer request.

Instalación
```bash
npm install
```

Ejecucion (dev)
```bash
npm run dev
```
Abrir `http://localhost:3000`.

Produccion
```bash
npm run build
npm run start
```

Variables de entorno
- `N8N_WEBHOOK_URL` (servidor) o `NEXT_PUBLIC_N8N_WEBHOOK_URL` (cliente) apuntando al Webhook en n8n.
- `RECOMMEND_USE_WEBHOOK`: `true` para usar n8n; `false` (por defecto) para usar la lógica local.
- Claves opcionales de APIs (si se usan desde n8n): Amadeus, Unsplash, OpenWeather, etc.
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_SSL` (persistencia Postgres).
- `DATABASE_SSL=true|1` habilita SSL.
- `AMADEUS_API_KEY`/`AMADEUS_API_SECRET` o `AMADEUS_CLIENT_ID`/`AMADEUS_CLIENT_SECRET` (hoteles).
- `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY`, `PIXABAY_API_KEY` (imagenes).
- `OPENTRIPMAP_API_KEY` (POIs/hoteles); sin key usa Wikipedia y datos sinteticos.
- `OPENWEATHER_API_KEY`, `BOOKING_API_KEY` solo si los usas en n8n.

Estructura relevante
- `src/app/questionnaire/page.tsx`: formulario de preferencias.
- `src/app/api/recommend/route.ts`: proxy al webhook y fallback.
- `src/app/results/page.tsx`: visualización de recomendaciones y hoteles.
- `config/`: base de destinos y reglas.
- `workflows/main-workflow.json`: skeleton del workflow n8n.

Workflow n8n
Importa `workflows/main-workflow.json` en n8n, añade credenciales y ajusta nodos HTTP para imágenes, clima y hoteles.
