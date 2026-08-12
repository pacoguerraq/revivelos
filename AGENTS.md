<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Revívelos — Guía para agentes y desarrolladores

**Qué es:** B2C mexicano que restaura, coloriza y anima fotos antiguas de familia usando IA. Mercado: familias mexicanas de 30-60 años. Idioma de la UI: español de México, tono cálido y personal.

**Stack exacto:** Next.js 16.3.0 · React 19.2.8 · TypeScript (strict, sin `any`) · Tailwind CSS v4 · App Router · Server Components por defecto.

---

## Comandos

```bash
nvm use 22          # Node ≥20 obligatorio — el sistema puede tener v16
npm run dev         # http://localhost:3000
npm run build
npm run lint
```

---

## Convenciones de código

- **`proxy.ts` en la raíz, no `middleware.ts`** — Next.js 16 exige este nombre y `export function proxy()`, no `middleware`.
- **Params como Promise:** en Next.js 15+, `params` en rutas dinámicas es `Promise<{...}>` — siempre `await params`.
- **Sin `Buffer` en `Response`:** usar `new Uint8Array(buf)` para pasar imágenes a `BodyInit`.
- **Tailwind v4:** sintaxis `@import "tailwindcss"` + bloque `@theme` en `globals.css`. No existe `tailwind.config.ts`. Preflight resetea todos los headings a `inherit` (=17px) — **nunca uses clases `text-2xl` etc. en headings de sección**: usa `SectionHeading` o inline `clamp()`.
- **Server Components por defecto.** `"use client"` solo cuando hay estado interactivo real. El Header lee créditos del store en el servidor.
- **Sin `any`** — TypeScript strict. Sin imports no usados.
- **Sin emojis en la UI** — todos los iconos son SVG en `components/icons/` con prop `size` y `currentColor`.
- **Sin comentarios obvios** — solo cuando el `por qué` es no obvio.

---

## Sistema de diseño — valores reales (`app/globals.css`)

```
--color-cream: #FAF6F0          (fondo base)
--color-warm-white: #FDF9F4     (cards)
--color-sepia-100: #EDE0CC
--color-sepia-200: #D9C4A8
--color-sepia-300: #C9A87C
--color-amber: #D4850A          (CTA principal, links activos)
--color-amber-dark: #A8640A
--color-amber-50: #FEF3E2
--color-bark: #3D2B1F           (texto principal)
--color-bark-muted: #7A5C45     (texto secundario)
--color-success: #4A7C59
--color-error: #B84040

--font-display: var(--font-lora)   (Lora, headings)
--font-sans: var(--font-inter)     (Inter, body)

html { font-size: 17px }
.btn { min-height: 56px; padding: 0 28px }   /* navbar buttons override a 38px */
.btn-primary   → amber sólido
.btn-secondary → amber outline
.btn-ghost     → sepia border
.card          → warm-white bg + sepia-100 border + radius-lg
.section-wrap  → max-width 1024px, padding 0 20px, margin auto
```

**Regla de jerarquía visual:** solo hay UN `.btn-primary` visible por pantalla (el CTA del hero o del paso actual). El Header usa `.btn-secondary`. Si añades otro botón prominente, hazlo outline.

---

## Mapa de archivos

```
proxy.ts                          # cookie anónima uid (httpOnly, 1 año)
lib/
  types.ts                        # Job, CreditBalance, StoredImage — fuente de verdad de tipos
  pricing.ts                      # RESTORE_COST=1, ANIMATE_COST=3, PACKAGES[], calcEquivalencias()
  ejemplos.ts                     # EJEMPLOS[] — rutas de imágenes en /public/ejemplos/
  stores.ts                       # jobsMap, imagesMap, creditsMap — Maps en memoria (mock)
  cookies.ts                      # getUserId() — lee cookie uid
app/
  globals.css                     # design system completo (ver arriba)
  layout.tsx                      # fuentes Lora + Inter, Header + Footer
  page.tsx                        # landing: Hero → Ejemplos → HowItWorks → Pricing → FAQ → CTA
  crear/page.tsx                  # sube foto → elige acción → POST /api/jobs
  procesando/[jobId]/page.tsx     # wrapper del poller
  resultado/[jobId]/page.tsx      # muestra imagen resultante + botones
  api/
    jobs/route.ts                 # POST → crea job, valida créditos, guarda imagen, lanza mock timer
    jobs/[jobId]/route.ts         # GET → estado del job (await params)
    image/[jobId]/route.ts        # GET → sirve imagen como Uint8Array
    credits/route.ts              # GET → balance | POST → 503 (TODO: Stripe)
components/
  layout/Header.tsx               # Server Component — lee créditos reales del store
  layout/Footer.tsx               # links de navegación
  landing/
    Hero.tsx                      # slider hero-antes/despues.jpg + CTA primario
    Ejemplos.tsx                  # 3 sliders de lib/ejemplos.ts
    HowItWorks.tsx                # pasos numerados
    Pricing.tsx                   # PackageCard × 3, importa lib/pricing.ts
    FAQ.tsx                       # Accordion con preguntas frecuentes
  ui/
    BeforeAfterSlider.tsx         # pointer events + clip-path; onError → ImageFallback con ruta
    PhotoUploader.tsx             # drag & drop + preview + selector restore/animate
    PackageCard.tsx               # calcula equivalencias con calcEquivalencias()
    ProgressStages.tsx            # poller cada 2s → redirige a /resultado/[jobId]
    SectionHeading.tsx            # OBLIGATORIO para h2 de sección — corrige preflight de Tailwind v4
    Accordion.tsx                 # FAQ items con animación max-height
    ShareButton.tsx               # botón de compartir resultado
  icons/
    CameraIcon.tsx  FilmIcon.tsx  PaletteIcon.tsx  LockIcon.tsx  DownloadIcon.tsx
```

---

## Estado real vs. pendiente

| Módulo | Estado |
|--------|--------|
| Identidad anónima (cookie uid) | Funcionando |
| Subida de foto y creación de job | Funcionando |
| Procesamiento mock (setTimeout 2s→11s) | Mock — no llama a ninguna IA |
| Créditos | Mock — Maps en memoria, se resetean al reiniciar |
| Imágenes de resultado | Mock — devuelve la misma imagen de entrada |
| Pago / Stripe | Sin implementar — POST /api/credits devuelve 503 |
| Imágenes de /public/ejemplos/ | Sin agregar — sliders muestran ImageFallback con la ruta |
| Base de datos | Sin implementar — todo vive en Maps |

---

## Roadmap (3 fases)

### Fase 1 — Infraestructura real
- **Prisma + Postgres** (Neon o Supabase): modelos `User`, `Job`, `CreditTransaction`. Migrar stores.ts → Prisma client. Deducción de créditos en transacción atómica.
- **`lib/storage.ts`**: abstracción local (disco) / producción (Cloudflare R2). Upload en `POST /api/jobs`, download en `/api/image/[jobId]`.
- **Imágenes de ejemplo reales**: agregar a `/public/ejemplos/` — `hero-antes.jpg`, `hero-despues.jpg`, `1-antes.jpg`, `1-despues.jpg`, `2-antes.jpg`, `2-despues.jpg`, `3-antes.jpg`, `3-despues.jpg`.

### Fase 2 — IA real
- **fal.ai** via webhook queue (no polling síncrono).
  - Restore: modelo Nanobanana (~$0.03 por imagen).
  - Animate: Wan 2.5 o Kling 2.5 Turbo Pro (~$0.08 por video, 5s).
- Punto de integración: `simulateMockProcessing()` en `app/api/jobs/route.ts`.
- Agregar `fal.ai` webhook receiver en `app/api/webhooks/falai/route.ts`.

### Fase 3 — Monetización y growth
- **Stripe** (tarjetas internacionales) + **Mercado Pago** (México — OXXO, SPEI, tarjetas locales).
- Webhook de pago → acreditar en `CreditTransaction`.
- **Meta Pixel + CAPI server-side** (evento `Purchase` debe ir por servidor para pasar iOS 14).
- **Cron de limpieza**: `app/api/cron/cleanup/route.ts` + `vercel.json` para borrar jobs viejos.

---

## Economía del producto

```
Paquete Básico:       5 créditos →  $99 MXN  ($19.80/crédito)
Paquete Familiar:    15 créditos → $249 MXN  ($16.60/crédito) ← popular
Paquete Álbum:       40 créditos → $599 MXN  ($14.97/crédito)

Costo de restore (Nanobanana):   ~$0.03 USD ≈ $0.50 MXN
Costo de animate (Wan/Kling):    ~$0.08 USD ≈ $1.40 MXN
Margen bruto estimado: >85%

Free tier: 1 restauración gratis (freeUsed en CreditBalance).
Riesgo: abuso con múltiples cookies. Mitigación futura: fingerprinting leve o captcha.
```

---

## Reglas que no se rompen

1. **Sin testimonios falsos** — riesgo legal con Meta Ads y Profeco. Usar solo before/after reales.
2. **Sin promesas de tiempo específico** — "un par de minutos", nunca "30 segundos" ni "2 minutos".
3. **Sin registro antes del resultado** — el usuario ve su foto procesada sin cuenta. Pedir email solo para notificaciones futuras (no implementado aún).
4. **Sin `localStorage`** para identidad — solo la cookie httpOnly `uid`.
5. **Sin librerías de UI** (shadcn, MUI, etc.) — todo es CSS custom via `globals.css`.
6. **Sin emojis en la UI** — solo SVG en `components/icons/`.
7. **Tono cálido, familiar, en español de México** — no corporativo, no frío.
8. **Mobile-first** — diseñar para 375px primero, luego escalar.
9. **Single source of truth**: costos → `lib/pricing.ts`, ejemplos → `lib/ejemplos.ts`. Nunca hardcodear precios ni rutas de imágenes.

---

## Variables de entorno (pendientes de agregar)

```
# .env.local
DATABASE_URL=           # Postgres (Neon/Supabase)
FALAI_KEY=              # fal.ai API key
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
MERCADOPAGO_ACCESS_TOKEN=
R2_ACCOUNT_ID=          # Cloudflare R2
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
NEXT_PUBLIC_BASE_URL=   # https://revivelos.mx
```

Hoy no existe `.env.local` en el repo. El proyecto corre sin variables porque todo es mock.
