<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Revívelos — Guía para agentes y desarrolladores

**Qué es:** B2C mexicano que restaura, coloriza y anima fotos antiguas de familia usando IA. Modelo de negocio: créditos de pago único, sin suscripciones.

**Quién compra:** público de 45-70 años que llega desde un anuncio de Facebook/Instagram, entra desde celular Android de gama media y no es técnico. La compra es impulsiva y emocional — son fotos de padres y abuelos, muchos ya fallecidos. Todo el copy en español de México, tono cálido, trato de "tú", sin anglicismos ni jerga de IA.

**Canal de adquisición:** Meta ads exclusivamente. Esto condiciona decisiones que parecerían menores: nada de testimonios falsos (baneo de cuenta publicitaria), evento `Purchase` por CAPI server-side, y el anuncio se apoya en el video animado como gancho.

**Stack exacto:** Next.js 16.3.0 · React 19.2.8 · TypeScript (strict, sin `any`) · Tailwind CSS v4 · App Router · Server Components por defecto.

---

## Comandos

```bash
nvm use 22          # Node ≥20 obligatorio — el sistema puede tener v16
npm run dev         # http://localhost:3000
npm run build
npm run lint
npx prisma migrate dev --name <descripcion>   # nueva migración tras editar schema.prisma
npx prisma studio                              # explorar la DB de Neon
```

---

## Prisma

- Cliente singleton en `lib/db.ts` (patrón `globalThis`, evita agotar conexiones con hot reload). Importar `prisma` desde ahí, nunca instanciar `PrismaClient` en otro archivo.
- `prisma@^6` / `@prisma/client@^6` — **fijado, no subir a v7** sin evaluar antes.
- `DATABASE_URL` (pooling, para el cliente de la app) y `DIRECT_URL` (sin pooler, para migraciones) — ambas ya en `.env`. Si `DATABASE_URL` falta, `lib/db.ts` lanza un error explícito al importarse en vez de fallar con un error críptico de conexión.
- **El descuento de créditos nunca es leer-y-luego-escribir.** `lib/jobs.ts` → `createJobAndCharge()` crea el `Job` y aplica un `UPDATE` condicional (`updateMany` con `WHERE credits >= costo` o `WHERE freeUsed = false`) dentro de la misma `$transaction`. Si el `count` resultante es 0, se lanza `InsufficientCreditsError` y Prisma revierte todo — incluida la creación del job, para no dejar huérfanos. No cambiar este patrón por un `findUnique` + `update` separados.
- Los enums de Prisma (`JobStatus`, `JobType` en mayúsculas) no son los tipos de la API pública (`lib/types.ts`, minúsculas) — `toApiJob()` en `lib/jobs.ts` es el único punto de conversión. Si se agrega un campo al `Job` de Prisma que deba viajar al cliente, se añade ahí, no se expone el objeto de Prisma directo.
- `CreditTransaction.jobId` es `onDelete: SetNull` a propósito: el cron de limpieza de jobs a 30 días (Fase 3, pendiente) puede borrar el `Job` sin arrastrarse el historial financiero.

---

## Convenciones de código

- **`proxy.ts` en la raíz, no `middleware.ts`** — Next.js 16 exige este nombre y `export function proxy()`, no `middleware`.
- **Params como Promise:** en Next.js 15+, `params` en rutas dinámicas es `Promise<{...}>` — siempre `await params`.
- **Sin `Buffer` en `Response`:** usar `new Uint8Array(buf)` para pasar imágenes a `BodyInit`.
- **Tailwind v4:** sintaxis `@import "tailwindcss"` + bloque `@theme` en `globals.css`. No existe `tailwind.config.ts`. Preflight resetea todos los headings a `inherit` (=17px) — **nunca uses clases `text-2xl` etc. en headings de sección**: usa `SectionHeading` o inline `clamp()`.
- **Server Components por defecto.** `"use client"` solo cuando hay estado interactivo real. El Header lee créditos de la DB en el servidor.
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
prisma/
  schema.prisma                   # User, Job, CreditTransaction — fuente de verdad de persistencia
  migrations/                     # migraciones generadas por `prisma migrate dev`
lib/
  types.ts                        # Job, CreditBalance — tipos de API (JobStatus/JobType/JobStage en minúscula)
  db.ts                           # singleton de PrismaClient (patrón globalThis)
  credits.ts                      # ensureUser, getBalance, addCredits, InsufficientCreditsError
  jobs.ts                         # createJobAndCharge, markSubmitted, failJobAndRefund, getJobForUser, toApiJob
  storage.ts                      # StorageAdapter — hoy Vercel Blob, put/delete
  fal.ts                          # config de fal, prompts validados, submitRestore/submitAnimate, extractores de payload
  fal-verify.ts                   # verificación ED25519 del webhook contra el JWKS de fal (cacheado 24h)
  watermark.ts                    # sharp: resize + marca de agua (2 líneas) para la vista previa gratuita
  fingerprint.ts                  # cliente: hash de canvas+navegador — 2da capa antiabuso del free tier
  pricing.ts                      # RESTORE_COST=1, ANIMATE_COST=3, PACKAGES[], calcEquivalencias()
  ejemplos.ts                     # EJEMPLOS[] — rutas de imágenes en /public/ejemplos/
  cookies.ts                      # getUserId() — lee cookie uid
app/
  globals.css                     # design system completo (ver arriba)
  layout.tsx                      # fuentes Lora + Inter, Header + Footer
  page.tsx                        # landing: Hero → Ejemplos → HowItWorks → Pricing → FAQ → CTA
  crear/page.tsx                  # sube foto → elige acción → POST /api/jobs
  procesando/[jobId]/page.tsx     # wrapper del poller — mensajes de espera honestos según el tipo
  resultado/[jobId]/page.tsx      # muestra imagen o <video> según Job.type + botones
  api/
    jobs/route.ts                 # POST → sube a Blob y a fal.storage, crea job + descuenta crédito, submitRestore
    jobs/[jobId]/route.ts         # GET → estado del job, valida dueño contra la DB (await params)
    image/[jobId]/route.ts        # GET → proxy autenticado: valida dueño, hace fetch al blob y reenvía bytes
    credits/route.ts              # GET → balance real de la DB | POST → 503 (TODO: Stripe)
    webhooks/falai/route.ts       # POST → verifica firma, procesa OK/ERROR, encadena restore→animate, reembolsa en fallos
components/
  layout/Header.tsx               # Server Component — lee créditos reales de la DB
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
    ProgressStages.tsx            # poller cada 2s, etapas restoring/animating reales → redirige a /resultado/[jobId]
    SectionHeading.tsx            # OBLIGATORIO para h2 de sección — corrige preflight de Tailwind v4
    Accordion.tsx                 # FAQ items con animación max-height
    ShareButton.tsx               # botón de compartir resultado
    DownloadButton.tsx            # descarga vía fetch+blob con loader — necesario para video (varios MB)
  icons/
    CameraIcon.tsx  FilmIcon.tsx  PaletteIcon.tsx  LockIcon.tsx  DownloadIcon.tsx
```

---

## Estado real vs. pendiente

| Módulo | Estado |
|--------|--------|
| Identidad anónima (cookie uid) | Funcionando — y ya no se emite si hay sesión autenticada (`proxy.ts`) |
| Autenticación (Google + magic link) | **Funcionando** — Auth.js v5 + `@auth/prisma-adapter`, sesión en DB. `lib/auth.ts` |
| Fusión de identidad anónimo → cuenta | **Funcionando** — un solo algoritmo cubre los 3 casos (`lib/auth-merge.ts` `mergeAnonymousUser`), llamado desde `events.signIn` en `lib/auth.ts` (no desde `callbacks.signIn` — ver nota abajo), probado contra la DB real incluyendo un job en vuelo fusionado a mitad de procesamiento |
| Galería `/mis-fotos` | **Funcionando** — requiere sesión, paginación por cursor, aviso de borrado a 30 días |
| Subida de foto y creación de job | Funcionando — sube a Vercel Blob, persiste en Postgres |
| Base de datos | **Funcionando** — Prisma + Neon Postgres. `User`, `Job`, `CreditTransaction` |
| Créditos | **Funcionando** — descuento atómico en transacción (`lib/jobs.ts` `createJobAndCharge`), auditable vía `CreditTransaction` |
| Almacenamiento de imágenes | **Funcionando** — Vercel Blob (`lib/storage.ts`), servidas solo vía proxy autenticado `/api/image/[jobId]` |
| Modelos y prompts de IA | **Funcionando** — integrados en `lib/fal.ts`, validados a mano en el sandbox de fal (ver sección siguiente) y confirmados en vivo contra la API real de fal |
| Procesamiento | **Funcionando** — cola de fal (`fal.queue.submit`) + webhook (`/api/webhooks/falai`), sin polling síncrono. RESTORE es una llamada; ANIMATE encadena restauración (siempre modelo PAID) → animación, correlacionadas por `Job.falRequestId` (único, se reescribe en cada salto de etapa) |
| Verificación de webhooks | **Funcionando** — ED25519 contra el JWKS de fal (`lib/fal-verify.ts`), timestamp con ventana de 5 min contra replay |
| Vista previa gratuita | **Funcionando** — `lib/watermark.ts` (sharp) reduce resolución y aplica marca de agua antes de guardar en Blob |
| Reembolsos | **Funcionando** — si fal devuelve error, el payload no tiene el formato esperado, o pasan 15 min sin respuesta (timeout perezoso en `getJobForUser`), el job pasa a FAILED y se reembolsa el crédito (o se revierte `freeUsed`) de forma atómica e idempotente |
| Imágenes de resultado | **Funcionando** — descargadas de fal (URLs `v3.fal.media`, temporales) y re-subidas a Vercel Blob antes de responder al usuario |
| Pago / Stripe | Sin implementar — `POST /api/credits` devuelve 503. `addCredits()` en `lib/credits.ts` ya existe para cuando se integre |
| Imágenes de /public/ejemplos/ | Sin agregar — sliders muestran ImageFallback con la ruta |

**Pendiente de verificar antes de producción:** los nombres exactos de los parámetros de input de cada modelo de fal (`image_urls` vs `image_url`, nombre del flag de audio) se implementaron según la convención más documentada y se confirmaron en vivo para `nano-banana*/edit` (`image_urls: string[]`) contra la API real; falta correr un job ANIMATE real de punta a punta para confirmar el input de `kling-video/.../image-to-video`.

---

## Modelos y prompts de IA — VALIDADOS

Probados a mano en el sandbox de fal contra 5 fotos reales de distinta severidad de daño (retrato individual, niña con craquelado severo, pareja con pérdida de emulsión, familia de 9 personas). Estos son los ganadores. **No cambiar sin volver a validar contra el mismo set.**

Los IDs de modelo y los prompts deben vivir en configuración (`lib/fal.ts` + variables de entorno), nunca hardcodeados en la lógica de negocio.

### Restauración — versión de pago

**Modelo:** `fal-ai/nano-banana-pro/edit` · $0.15 USD/imagen (1K) · ~20s

```
Restore and colorize this damaged photograph.

Remove all cracks, tears, scratches, stains, fold lines and missing emulsion, reconstructing damaged areas strictly from the surrounding content.

Add realistic color with a muted, era-appropriate palette: natural skin tones with no rosy or oversaturated cheeks, believable ambient lighting, clothing colors consistent with the period. The result should look like a well-preserved film photograph from the era, not a modern digital or HDR image.

Strict constraints:
- Do not add, remove, replace or rearrange any object, flower, garment or background element that is not visible in the original.
- Where damage obscures a detail, infer it conservatively from what remains. Never invent a more interesting version.
- The people must remain recognizable as the exact same individuals: preserve facial features, expressions, proportions and hairstyle precisely.
- Do not beautify, do not smooth skin, do not over-sharpen, do not increase contrast or saturation beyond natural levels.
- Preserve the original framing and composition exactly.
```

### Restauración — vista previa gratuita

**Modelo:** `fal-ai/nano-banana/edit` · $0.039 USD/imagen · ~8s

Prompt distinto a propósito: el modelo barato tiende a dejar la foto pálida y parcialmente coloreada, así que se quitan las restricciones de paleta apagada y se le exige color completo.

```
Restore and colorize this damaged photograph.

Remove all cracks, tears, scratches, stains, fold lines and missing emulsion, reconstructing damaged areas strictly from the surrounding content.

Add full, realistic color to the entire image — skin, clothing, background and every object. Do not leave any area grey, washed out or partially colorized. Use natural skin tones with no rosy or oversaturated cheeks, and believable ambient lighting. The result should look like a color film photograph, not a hand-tinted black and white image.

Strict constraints:
- Do not add, remove, replace or rearrange any object, flower, garment or background element that is not visible in the original.
- Where damage obscures a detail, infer it conservatively from what remains. Never invent a more interesting version.
- The people must remain recognizable as the exact same individuals: preserve facial features, expressions, proportions and hairstyle precisely.
- Do not beautify, do not smooth skin, do not change anyone's apparent age.
- Preserve the original framing and composition exactly.
```

El resultado gratuito se entrega en **baja resolución + marca de agua**, y se comunica como "vista previa", nunca como el resultado final. Si esta versión sale demasiado pálida en producción, el siguiente escalón es `fal-ai/nano-banana-2/edit` ($0.08).

### Animación

**Modelo:** `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` · $0.07 USD/s → **$0.35 por clip de 5s** · 67-142s

Configuración: 5 segundos, **sin audio** (el audio duplica el costo y no aporta).

**La entrada debe ser la imagen ya restaurada, nunca la original dañada** — si no, el modelo anima las grietas.

```
Each person in the photograph comes to life with subtle, natural movement. They blink, breathe gently, and shift their weight very slightly. One or more of them may slowly turn their head slightly toward the camera and give a soft, warm smile.

If there is more than one person, each moves independently and at their own timing — never in unison. Stagger the blinks and micro-movements so they feel like separate living people, not a synchronized animation. Vary the intensity: some may move slightly more than others.

Movement is slow, gentle and minimal. The camera is completely static.

Photorealistic. Preserve the exact facial features and identity of every person. No camera movement, no zoom, no talking, no dramatic gestures, no change in who anyone is.
```

### Modelos descartados y por qué

- **`fal-ai/wan-25-preview/image-to-video`** — descartado. En pruebas reales cobró **$0.75 por clip de 5s** (no los $0.25 de la tabla de precios) y produjo movimiento notoriamente peor: caras casi estáticas, o sujetos que se dormían. Kling es mejor y más barato.
- **`nano-banana-lite`** — calidad insuficiente.
- **Kling v3 y Veo 3.x** — capacidades (multishot, audio nativo) que este producto no necesita, a 2-4x el precio.
- **Qwen** para el paso final — cobra por megapixel, se dispara en alta resolución.

### Limitaciones conocidas (no son bugs)

- Donde el daño destruyó información, el modelo adivina. En una foto muy dañada inventó calcetas largas donde eran cortas. Ni un restaurador humano acertaría sin conocer a la familia.
- Partiendo de blanco y negro, el color de una prenda es indecidible: distintas corridas dan distintos colores. No se arregla con prompt.
- La animación se degrada con el número de personas. Con 1-2 sujetos y rostros grandes queda excelente; con 9 personas funciona pero se ve exagerado que casi todos se muevan. **Avisar esto en la UI antes del gasto** ("Funciona mejor con fotos de una o dos personas y rostros grandes") evita reembolsos.
- Los sujetos que ya miran a cámara animan mejor que los que están de perfil.

---

## Roadmap (3 fases)

### Fase 1 — Infraestructura real ✅ hecho
- Prisma + Neon Postgres: `User`, `Job`, `CreditTransaction`. Deducción de créditos en transacción atómica (`updateMany` condicional, nunca leer-y-luego-escribir).
- `lib/storage.ts` sobre Vercel Blob. Upload en `POST /api/jobs`, download proxied en `/api/image/[jobId]`.
- **Pendiente de esta fase:** imágenes de ejemplo reales en `/public/ejemplos/` (`hero-antes.jpg`, `hero-despues.jpg`, `1-antes.jpg`…`3-despues.jpg`) — los sliders siguen mostrando `ImageFallback`.

### Fase 2 — IA real ✅ hecho
- `lib/fal.ts` con los IDs de modelo (env) y los prompts validados, `submitRestore`/`submitAnimate`.
- Cola con webhooks (`app/api/webhooks/falai/route.ts`), sin polling síncrono. El cliente consulta estado contra nuestra propia DB (`GET /api/jobs/[jobId]`), no contra fal.
- Verificación ED25519 del webhook contra el JWKS de fal (`lib/fal-verify.ts`) — body crudo, sin secreto compartido.
- Idempotencia: `Job.falRequestId` (único) correlaciona el webhook; se reescribe en cada salto de etapa (`Job.stage`), así una entrega duplicada de una etapa ya superada deja de encontrar el job y es un no-op automático. El salto RESTORING → ANIMATING se reclama con un `updateMany` condicional antes de lanzar la segunda llamada a fal, para que dos entregas casi simultáneas no disparen dos videos.
- Las URLs que devuelve fal (`v3.fal.media`) son temporales — se descargan y se re-suben a Blob antes de responder al usuario. Para encadenar restore→animate se usa la URL de fal directamente (todavía vigente en ese momento), no hace falta re-subir a `fal.storage`.
- Vista previa gratuita: `lib/watermark.ts` (sharp) reduce resolución y aplica marca de agua antes de guardar.
- Fallos: `failJobAndRefund()` en `lib/jobs.ts` marca `FAILED` y reembolsa (o revierte `freeUsed`) en una transacción corta sin red, protegida por un `updateMany` condicional para ser idempotente ante reintentos del webhook. Timeout perezoso de 15 min en `getJobForUser` para jobs que nunca reciben webhook.
- **Pendiente de esta fase:** correr un job ANIMATE real de punta a punta para confirmar el input exacto de `kling-video/.../image-to-video` (ver nota en la tabla de estado). Evaluar recortar el clip a ~3s en loop si la degradación al final del video resulta molesta en pruebas reales.

### Fase 3 — Monetización y growth ← SIGUIENTE
- **Stripe** (tarjetas) + **Mercado Pago** (OXXO, SPEI, tarjetas locales). Los dos, no uno: el comprador de 55 años muchas veces no mete tarjeta.
- Webhook de pago → acreditar en `CreditTransaction`.
- **Meta Pixel + CAPI server-side**: disparar `Purchase` desde la API route al confirmar el pago. Sin CAPI el algoritmo optimiza a ciegas y el CPA nunca baja.
- **Cron de limpieza**: `app/api/cron/cleanup/route.ts` protegido con `CRON_SECRET` + `vercel.json`. El sitio ya promete borrado a 30 días; hay que cumplirlo.
- Comprar dominio propio. Una URL de Vercel en el anuncio baja la confianza justo en el público que menos confía en pagar en línea.

---

## Economía del producto

Tipo de cambio de referencia: **~17.1 MXN/USD** (agosto 2026). Todos los costos incluyen un factor **1.3x** por reintentos, regeneraciones y fallos.

### Costo por operación

| Operación | APIs | Costo real | Con 1.3x | MXN |
|---|---|---|---|---|
| Restauración (pago) | Nano Banana Pro $0.15 | $0.15 | $0.195 | **$3.33** |
| Restauración (gratis) | Nano Banana $0.039 | $0.039 | $0.051 | **$0.87** |
| Video 5s | Pro $0.15 + Kling $0.35 | $0.50 | $0.65 | **$11.10** |

El video cuesta **3.3x** una restauración y vale **3 créditos**. La proporción está bien calibrada; no cambiarla sin rehacer estas cuentas.

### Paquetes y margen (peor caso: todo gastado en video, menos comisión de pago ~3.6% + $3)

| Paquete | Precio | Neto | Costo API máx. | Utilidad | Margen |
|---|---|---|---|---|---|
| Básico (5 cr) | $99 | $92 | $18 | $74 | 80% |
| Familiar (15 cr) | $249 | $237 | $56 | **$181** | 76% |
| Álbum (40 cr) | $599 | $574 | $148 | $426 | 74% |

### El número que decide la campaña

El riesgo no es el costo por venta, es **el free tier**. Con el paquete Familiar cada venta deja $181 MXN de utilidad bruta. Al 3% de conversión, por cada comprador hay 33 personas que usaron su restauración gratis:

- Free tier con **Nano Banana Pro**: 33 × $3.33 = $110 MXN quemados por venta → quedan **$71 MXN** para el anuncio.
- Free tier con **Nano Banana normal**: 33 × $0.87 = $29 MXN → quedan **$152 MXN** para el anuncio.

Por eso la vista previa gratuita usa el modelo barato. Esa decisión duplica el presupuesto publicitario disponible por adquisición.

**Métrica a vigilar en la primera campaña:** costo por foto subida. Si está por debajo de ~$5 MXN y la conversión supera el 3%, el negocio funciona. Si el CPA se dispara, la palanca es la conversión, no el precio.

### Controles antiabuso del free tier

Una sola restauración gratis por usuario (`freeUsed`), en baja resolución, con marca de agua. El video **nunca** gratis completo — máximo un preview corto con marca de agua.

**Funcionando:** doble capa — `User.freeUsed` (cookie `uid`) + `DeviceFingerprint` (hash de canvas + características del navegador, calculado en `lib/fingerprint.ts` y enviado por `PhotoUploader` en cada submit). El reclamo de ambos es atómico (`lib/jobs.ts` → `createJobAndCharge`): si el fingerprint ya se usó, el job se cobra como cualquier otro en vez de bloquear al usuario. Si el job falla, `failJobAndRefund` revierte tanto `freeUsed` como el fingerprint. Límite honesto: sobrevive a incógnito y a borrar cookies del mismo navegador, pero no a cambiar de navegador — eso requeriría fingerprinting de terceros (FingerprintJS Pro o similar) o server-side (IP), fuera de alcance por ahora.

**Pendiente de ajustar:** el paquete Básico de 5 créditos es un número incómodo (1 video y sobran 2). Considerar 6 créditos o bajar el precio a $89.

---

## Reglas que no se rompen

1. **Sin testimonios falsos** — riesgo legal con Profeco y baneo de la cuenta de Meta Ads, que es el único canal de adquisición del negocio. Solo before/after reales.
2. **Sin promesas de tiempo específico** — "un par de minutos", nunca "en segundos". Los tiempos medidos (8-142s más cola y storage) no permiten prometer más.
3. **Sin registro antes del resultado** — el usuario ve su foto procesada sin cuenta. Pedir email solo para notificaciones futuras (no implementado aún).
4. **Sin `localStorage`** para identidad, créditos o estado de jobs — solo la cookie httpOnly `uid` y la DB.
5. **Sin librerías de UI ni de estado** (shadcn, MUI, Zustand, Framer Motion) — todo es CSS custom vía `globals.css`.
6. **Sin emojis en la UI** — solo SVG en `components/icons/`.
7. **Tono cálido, familiar, en español de México** — no corporativo, no frío, sin jerga de IA.
8. **Mobile-first** — diseñar para 375px primero. Texto base 17px, botones 52px+, alto contraste: el usuario tiene 60 años y está en un celular.
9. **Single source of truth**: costos y créditos → `lib/pricing.ts`; ejemplos → `lib/ejemplos.ts`; modelos y prompts de IA → `lib/fal.ts` + env. Nunca hardcodear.
10. **La vista previa gratuita se comunica como vista previa** — y la comparación que la justifique debe ser de fotos reales procesadas con ambos modelos, no una diferencia exagerada. Misma regla que los testimonios.

---

## Variables de entorno

```
# .env
DATABASE_URL=              # Postgres pooled (Neon) — cliente de la app
DIRECT_URL=                # Postgres sin pooler — migraciones

BLOB_READ_WRITE_TOKEN=     # Vercel Blob

FAL_KEY=                   # fal.ai API key
FAL_MODEL_RESTORE_PAID=fal-ai/nano-banana-pro/edit
FAL_MODEL_RESTORE_FREE=fal-ai/nano-banana/edit
FAL_MODEL_ANIMATE=fal-ai/kling-video/v2.5-turbo/pro/image-to-video
# No hay FAL_WEBHOOK_SECRET: fal firma con ED25519 y se valida contra
# su JWKS público (https://rest.alpha.fal.ai/.well-known/jwks.json),
# no con un secreto compartido. Ver lib/fal-verify.ts.

AUTH_SECRET=                # firma cookies/tokens de Auth.js — generar con `npx auth secret` u openssl, no requiere servicio externo
AUTH_URL=                   # origen canónico del sitio (hoy el túnel de ngrok). Determina useSecureCookies → el nombre real de la cookie de sesión es __Secure-authjs.session-token si AUTH_URL es https, aunque se pruebe sobre http en local
AUTH_GOOGLE_ID=              # Google Cloud Console — ver instrucciones abajo
AUTH_GOOGLE_SECRET=
AUTH_RESEND_KEY=             # Resend — ver instrucciones abajo
EMAIL_FROM="Revívelos <noreply@tudominio.mx>"

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
MERCADOPAGO_ACCESS_TOKEN=

CRON_SECRET=               # protege /api/cron/cleanup
NEXT_PUBLIC_FB_PIXEL_ID=
NEXT_PUBLIC_BASE_URL=       # usada para construir el webhookUrl que se le pasa a fal.queue.submit
```

Hoy vive en `.env` (no `.env.local`) en este entorno de desarrollo, con `DATABASE_URL`/`DIRECT_URL` de Neon, `BLOB_READ_WRITE_TOKEN` de Vercel Blob y `FAL_KEY` reales. `NEXT_PUBLIC_BASE_URL` apunta a un túnel de ngrok mientras no hay dominio propio — cámbiala si el túnel cambia, o los webhooks de fal no van a poder llegar. `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`/`AUTH_RESEND_KEY` hoy tienen placeholders (`"placeholder-configure-me"`) solo para que el servidor arranque en dev — el login real no funciona hasta reemplazarlos por credenciales reales.

**Gotcha de dev con `AUTH_URL` en https (ngrok):** el navegador solo guarda cookies con prefijo `__Secure-` en orígenes https. Si `AUTH_URL` apunta al túnel de ngrok (https) pero se navega directo a `http://localhost:3000`, el login se ve roto — la cookie de sesión nunca se guarda. Para probar login en local, hay que navegar a través de la URL de ngrok, no de `localhost` directo.

**`callbacks.signIn` corre ANTES de que exista la fila de `User`, no después.** Para un usuario nuevo el orden real es: perfil de OAuth → `callbacks.signIn` → (si devuelve `true`) `adapter.createUser` + `createSession` → `events.signIn`. Cualquier código en `callbacks.signIn` que asuma que `user.id` ya tiene fila en la DB (un `update`, o `mergeAnonymousUser`) falla con "No record was found for an update" en el primer login de cada cuenta nueva, y Auth.js traduce esa excepción en un `AccessDenied` genérico — no hay traza clara hacia la causa real. La regla: todo lo que necesite que el usuario ya exista en la DB va en `events.signIn` (recibe `user`, `account`, `profile` e `isNewUser`, y sí corre después de crear usuario y sesión), nunca en el callback. Lo que sí puede ir en el callback es lógica que no toca la DB por ese id — como decidir si permitir o negar el login (por ejemplo, el guard de `allowDangerousEmailAccountLinking` de abajo, que solo lee). Ver `lib/auth.ts`.

**Un solo usuario por correo, sin importar el método (Google ↔ magic link).** `Google({ allowDangerousEmailAccountLinking: true })` deja que un login de Google se enlace a una cuenta existente con el mismo correo (creada antes por magic link) en vez de fallar con `OAuthAccountNotLinked`. Es seguro **solo en este provider y solo porque las dos partes ya probaron ser dueñas del correo por caminos independientes**: Google, cuando `profile.email_verified === true`; el magic link, por definición, al haberlo clickeado. `callbacks.signIn` bloquea explícitamente el caso peligroso (Google con `email_verified: false` intentando enlazar a una cuenta que ya existe) devolviendo `false` — un correo no verificado no prueba nada. **Si se agrega otro provider OAuth, no copiar la bandera sin repetir este mismo análisis para ese provider.** Al enlazar, `events.signIn` rellena `name`/`image`/`emailVerified` **solo si están en null** (nunca pisa un valor que el usuario ya tenía) — probado contra la DB real en ambos órdenes (magic link→Google y Google→magic link).

**`events.signOut` limpia la cookie `uid`, y es obligatorio.** `setAnonUidCookie()` reescribe `uid` al id del usuario autenticado en cada login (para que un login posterior en el mismo dispositivo se fusione en vez de crear otro anónimo). Sin limpiarla al salir, `uid` se queda apuntando a una cuenta real ya sin sesión — `getUserId()` la toma como identidad anónima y expone el saldo/créditos de esa cuenta sin necesidad de volver a autenticarse. Se detectó y confirmó este bug contra la DB real antes de corregirlo.

**`proxy.ts` valida el *valor* de la cookie de sesión, no solo su presencia.** La respuesta de `/api/auth/signout` limpia `...session-token` con `Set-Cookie: ...=;` **sin `Expires`/`Max-Age`** — el navegador la conserva como cookie de sesión con valor vacío hasta que se cierra, no la borra. Un `request.cookies.has(name)` la cuenta como "hay sesión" igual, así que después de salir nunca se emitía un `uid` nuevo y `getUserId()` caía al fallback — que además era un literal `'anonymous'` compartido entre cualquiera en ese estado (ya corregido: el fallback ahora es un `crypto.randomUUID()` por request, nunca un id fijo). La regla: cualquier chequeo de "¿hay sesión?" en código que corre antes de `auth()` (o sin DB a mano, como en `proxy.ts`) debe revisar `.value`, no solo que la cookie exista.

### Configuración externa pendiente (auth)

Esto no lo puede hacer un agente — hay que configurarlo a mano fuera del repo:

1. **Google Cloud Console** → crear credenciales OAuth 2.0 (tipo "Web application"):
   - **Authorized redirect URIs** — agregar *ambas*, dev y producción:
     - `https://ducky-awning-reckless.ngrok-free.dev/api/auth/callback/google` (o el subdominio de ngrok vigente)
     - `https://<dominio-de-producción>/api/auth/callback/google`
   - Copiar el Client ID y Client Secret a `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.
   - Si el túnel de ngrok cambia de subdominio (pasa en el plan gratuito cada vez que se reinicia), hay que volver a agregar la nueva redirect URI aquí — si no, Google responde `redirect_uri_mismatch`.
2. **Resend**: verificar el dominio de envío (`EMAIL_FROM`, hoy `noreply@tudominio.mx` como placeholder) — sin dominio verificado, Resend rechaza el envío o lo manda a spam agresivamente. Generar la API key y ponerla en `AUTH_RESEND_KEY`.

---

## Cómo trabajar en este repo

Al terminar un cambio, **actualiza la tabla "Estado real vs. pendiente"** de este archivo. Es lo primero que lee el siguiente agente y lo que más rápido se desactualiza.