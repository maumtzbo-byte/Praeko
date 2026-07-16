# Praeko

SaaS de marketing con agentes de IA para negocios pequeños en México. Ver
`docs/PHASE_1_PLAN.md` para la arquitectura completa de la Fase 1.

Ya construido: landing page, autenticación completa, onboarding de 7 pasos,
dashboard con navegación y Configuración. Pendiente de API keys: generación
de contenido (Claude, fal.ai), pagos (Stripe) y redes sociales (Fase 2).

## Desarrollo

```bash
npm install
cp .env.example .env.local   # llena las API keys que ya tengas
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **3D / liquid metal**: react-three-fiber + drei
- **Backend**: Supabase (Postgres + Auth + Row Level Security)
- **Agentes de IA**: API de Claude (Anthropic), incluyendo visión
- **Generación de video/imagen**: fal.ai (Kling 3.0 Pro / Seedance 2.0) detrás
  de un adapter genérico (`src/lib/providers/generation`)
- **Pagos**: Stripe
- **Redes sociales**: Meta Graph API, TikTok API for Business (Fase 2)

## Estructura

Ver la sección "Estructura de carpetas" en `docs/PHASE_1_PLAN.md`.
