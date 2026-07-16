# Praeko — Plan de Fase 1

Este documento resume lo que ya se construyó como base/estructura y las
decisiones de arquitectura que el spec original pide explicar antes de
construir cada pieza. Revísalo y corrígeme el rumbo donde no sea lo que
quieres — nada de esto es difícil de cambiar todavía.

## 1. Qué ya existe en este repo

- **Landing page** (`src/app/page.tsx` + `src/components/marketing/*`):
  estilo liquid metal / chrome como la imagen de referencia — orbe 3D
  distorsionado (`react-three-fiber` + `drei`, iluminación procedural sin
  depender de un HDR externo), fondos con blobs de metal líquido en CSS,
  secciones de los 8 agentes, "cómo funciona", precios (Básico/Pro/Max con
  las cifras exactas del spec) y footer.
- **Esquema de base de datos** (`supabase/migrations/0001_init.sql`): modelo
  multi-tenant completo con RLS desde la creación de cada tabla (ver §2).
- **Andamiaje de backend** (clientes de Supabase, interfaz de proveedor de
  generación, cliente de Claude, tipos de contenido, lógica de presupuesto
  de duración de video) — todo como stubs que lanzan un error claro de
  "falta API key" hasta que conectes las credenciales reales. Ningún stub
  esconde lógica de negocio a medias: son puntos de entrada explícitos, no
  implementaciones parciales.
- **`.env.example`** con cada variable que vas a necesitar por fase.

No se ha construido: onboarding real, llamadas reales a Claude/fal.ai/Stripe,
ni el dashboard. Eso viene después de que conectes las API keys y confirmes
las decisiones abiertas de abajo.

## 2. Arquitectura de datos

Un negocio = un tenant (`businesses`), con `business_members` como tabla de
unión usuario↔negocio+rol — deliberadamente muchos-a-muchos para no cerrar
la puerta a que un usuario tenga más de un negocio después, sin que eso
signifique construir workspaces multi-marca ahora.

- `plans`: datos de referencia (no tenant-scoped) con los límites exactos de
  cada plan — una sola fuente de verdad que el frontend y el backend leen
  por igual.
- `subscriptions`: 1 fila por negocio, vinculada a Stripe. Solo la escribe el
  webhook server-side (service role), nunca el cliente.
- `brand_profiles` + `brand_assets`: el perfil de marca estructurado y la
  biblioteca de activos reutilizables (logo, fotos, videos, paleta,
  tipografías, piezas "me gustó este estilo").
- `content_calendar`: una fila por pieza planeada (día, tipo, formato,
  guion, duración objetivo, horario recomendado, estado).
- `generations`: el ledger de cada generación real — costo, proveedor,
  duración, resultado de revisión de calidad. Esto es lo que te deja auditar
  margen real por cliente en cualquier momento.
- `usage_counters`: contador mensual acumulado (piezas y segundos de video)
  por negocio — el respaldo del sistema de presupuesto de duración (§4).

RLS: cada tabla tenant-scoped tiene políticas basadas en
`is_business_member(business_id)` desde el `create table`, no agregadas
después. `subscriptions`, `generations` y `usage_counters` solo tienen
política de lectura para el usuario — se escriben exclusivamente con la
service-role key desde webhooks/jobs, nunca desde el navegador.

## 3. Estructura de carpetas

```
src/
  app/                        rutas Next.js (App Router)
    page.tsx                  landing page
    (app)/dashboard/          dashboard autenticado (placeholder, Fase 1.6)
  components/
    marketing/                secciones de la landing
    three/                    escena 3D (orbe liquid metal)
    ui/                       primitivas compartidas (vacío por ahora)
  lib/
    supabase/                 clientes browser/server/service-role + tipos
    agents/                   cliente de Claude + contratos de cada agente
    providers/generation/     interfaz genérica + adapter de fal.ai
    plans/                    límites por plan + lógica de presupuesto
    content/                  tipos compartidos (enums que reflejan la DB)
  server/                     vacío — aquí van route handlers / server actions
supabase/
  migrations/                 SQL versionado, RLS incluido desde el día 1
docs/
  PHASE_1_PLAN.md             este documento
```

## 4. Sistema de presupuesto de duración (Pro y Max)

Implementado en `src/lib/plans/limits.ts` como una **bolsa de segundos por
mes**, no como validación por video aislado:

```
presupuesto_mes = videos_del_mes × duración_promedio
```

Cada generación de video se valida contra tres reglas, en este orden:

1. ¿Ya se alcanzó el número de videos del mes? → bloquear.
2. ¿La duración pedida excede el tope máximo por video (25s Pro / 30s Max)?
   → bloquear, sin excepción.
3. ¿`segundos_usados_del_mes + duración_pedida` excede el presupuesto total
   del mes? → bloquear.

Un video puntual puede usar el tope máximo (ej. 25s en Pro) siempre que la
bolsa total todavía tenga espacio — lo cual, matemáticamente, obliga a que
los videos siguientes del mes sean más cortos para no vaciar la bolsa antes
de tiempo. No hace falta recalcular promedios proyectados: la bolsa ya lo
resuelve. `usage_counters` lleva `videos_used` y `video_seconds_used` por
negocio y mes; cada generación aprobada incrementa ambos atómicamente en la
misma transacción que la inserta en `generations`.

## 5. Decisiones que el spec pide explicar antes de construir

Estas piezas de Fase 1.5 todavía no están implementadas — son las que
quieres revisar antes de que escriba el código real:

**Generación asíncrona de video.** Propuesta: una tabla `generation_jobs`
(o reutilizar `generations` con un estado `queued/processing`) + un
Supabase Edge Function que solo *encola* el job en fal.ai y regresa de
inmediato, y un segundo mecanismo (webhook de fal.ai si está disponible, o
un cron de Supabase que hace polling cada 1-2 min) que actualiza el estado
cuando el proveedor termina. Nunca una edge function bloqueada esperando el
resultado.

**Revisión de calidad para video.** Extraer 3 frames (inicio/medio/fin) con
`ffmpeg` en el mismo worker que procesa el video, mandarlos a Claude con
visión junto con la transcripción de Whisper y el guion original, y pedir un
veredicto estructurado (`aprobado` / `necesita_revision_humana` /
`rechazado`) con la razón. Esto ya tiene su lugar en el schema
(`generations.quality_review_result`).

**Moderación de contenido.** Antes de decidir el proveedor, valdría la pena
confirmar contigo: Claude ya puede hacer un chequeo de políticas básicas
como parte del mismo prompt de revisión de calidad (texto e imágenes), y
para video/imagen generado por fal.ai algunos proveedores exponen su propio
flag de moderación en la respuesta — lo reviso cuando tengamos la API key de
fal.ai para ver qué tan confiable es antes de depender solo de eso.

**Storage del contenido generado.** Recomendación: Supabase Storage para
Fase 1 (mismo proyecto, RLS reutilizable, sin infraestructura extra) con un
bucket privado por tipo de asset; si el volumen de video crece y la latencia
de descarga se vuelve un problema real, migrar a un CDN externo (Cloudflare
R2 + CDN) es un cambio de adapter, no una reescritura, si mantenemos el
`storage_path` como referencia lógica en vez de URLs absolutas.

## 6. Orden de construcción sugerido a partir de aquí

1. Conectar Supabase real, aplicar `0001_init.sql`, generar tipos.
2. Auth + creación de negocio (1.1) — probar RLS con dos negocios de
   prueba antes de seguir.
3. Onboarding del agente de negocio (1.2) — cuestionario + subida de fotos +
   "analizar sitio web" opcional.
4. Agente de estrategia + guiones (1.3) con salida estructurada.
5. Límites por plan en el backend (1.4) — ya está la lógica en
   `src/lib/plans/limits.ts`, falta conectarla a `usage_counters` real.
6. Generación visual (1.5) — aquí se resuelven las cuatro decisiones del
   §5 con código real.
7. Dashboard básico (1.6) y Stripe (1.7).

No se avanza a Fase 2 hasta que 1.1–1.7 funcionen de punta a punta con un
negocio de prueba real, tal como pediste.
