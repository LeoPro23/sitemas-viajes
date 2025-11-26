# Guía del Workflow n8n

Este documento describe el flujo principal para el Sistema Experto de Recomendación de Viajes.

## Resumen

1. `Webhook` (inicio): recibe `userPreferences` del frontend.
2. `Function` (sistema experto): aplica reglas y calcula puntajes.
3. `HTTP Request` (destinos, imágenes, clima, hoteles): consulta APIs externas.
4. `Function` (formateo): estructura la respuesta final (destino, alternativas, hoteles).
5. `Respond to Webhook`: devuelve JSON al frontend.

## Nodos recomendados

- Webhook
- Function / Code
- HTTP Request
- IF / Switch
- Set
- Merge
- Item Lists
- Respond to Webhook

## Consideraciones

- Manejar errores con `try/catch` en nodos de código.
- Configurar timeouts en `HTTP Request` y rate‑limit.
- Usar caché cuando sea posible.

## Importación

Importa `workflows/main-workflow.json` en n8n y añade credenciales de APIs.