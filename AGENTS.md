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
- `CreditTransaction.jobId` es `onDelete: SetNull` a propósito: el cron de limpieza de jobs a 30 días (`app/api/cron/cleanup/route.ts`, **funcionando**) borra el `Job` sin arrastrar el historial financiero — verificado en vivo, ver sección "Borrado a 30 días" más abajo.

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
--color-amber: #A8640A          (CTA principal, botones, bordes)
--color-amber-dark: #8A5208     (hover/active de amber; también texto de enlaces y de .btn-secondary)
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
  credits.ts                      # ensureUser, getBalance, addCredits, addCreditsFromPurchase (idempotente vía externalId), InsufficientCreditsError
  stripe.ts                       # singleton de Stripe (patrón globalThis, igual que db.ts)
  checkout-client.ts               # startCheckout() — lógica compartida entre PackageCard y /comprar/[packageId]
  meta-capi.ts                    # sendPurchaseCapiEvent — evento Purchase server-side, best-effort si falta META_CAPI_TOKEN
  jobs.ts                         # createJobAndCharge, markSubmitted, failJobAndRefund, getJobForUser, toApiJob
  storage.ts                      # StorageAdapter — hoy Vercel Blob, put/delete
  fal.ts                          # config de fal, prompts validados, submitRestore/submitAnimate, extractores de payload
  fal-verify.ts                   # verificación ED25519 del webhook contra el JWKS de fal (cacheado 24h)
  watermark.ts                    # sharp: resize + marca de agua (2 líneas) para la vista previa gratuita
  fingerprint.ts                  # cliente: hash de canvas+navegador — 2da capa antiabuso del free tier
  pricing.ts                      # RESTORE_COST=1, ANIMATE_COST=3, PACKAGES[], calcEquivalencias()
  ejemplos.ts                     # EJEMPLOS[] — rutas de imágenes en /public/ejemplos/
  cookies.ts                      # getUserId() — sesión de Auth.js si existe, si no el uid anónimo; setAnonUidCookie/clearAnonUidCookie
  auth.ts                         # config de Auth.js v5: Google + Resend, fusión de identidad, enriquecimiento de perfil
  auth-merge.ts                   # mergeAnonymousUser — un solo algoritmo para los 3 casos de fusión anónimo→cuenta
  email.ts                        # magic link con marca propia vía Resend (no la plantilla default de Auth.js)
  og-image.tsx                    # composición compartida antes/después para opengraph-image.tsx y twitter-image.tsx
  rate-limit.ts                   # checkRateLimit(s), enforceGeneralRateLimit — ventana fija en Postgres, sin Redis
  file-validation.ts              # validateImageFile — detección de tipo real por magic bytes, nunca por Content-Type/extensión
app/
  globals.css                     # design system completo (ver arriba)
  layout.tsx                      # fuentes Lora + Inter, Header + Footer, StickyMobileCta, Analytics/SpeedInsights/MetaPixel, metadataBase + title template + OG/Twitter base
  page.tsx                        # landing: Hero → Ejemplos → HowItWorks → Pricing → FAQ → CTA + JsonLd
  not-found.tsx / error.tsx / global-error.tsx / loading.tsx # convenciones de error/carga — tono cálido, sin stack traces
  robots.ts / sitemap.ts / manifest.ts   # convenciones de App Router — excluyen /mis-fotos, /resultado/*, /procesando/*, /api/*
  llms.txt/route.ts               # descripción del sitio para agentes de IA, texto plano
  opengraph-image.tsx / twitter-image.tsx # generan la imagen para compartir (next/og) — ver nota de lib/og-image.tsx
  icon.png / apple-icon.png       # favicon y apple-touch-icon (convención de archivo, sin código)
  privacidad/ terminos/ reembolsos/page.tsx # legales — BORRADOR sin revisión de abogado, ver comentario al inicio de cada archivo
  restaurar-fotos-antiguas/ animar-fotos-en-video/page.tsx # landings SEO por servicio, cada una con su H1/FAQ/canonical propios
  acerca/page.tsx                 # página "por qué existe" — primera persona, sin equipo ni métricas inventadas
  crear/page.tsx                  # sube foto → elige acción → POST /api/jobs
  entrar/page.tsx                 # login: botón de Google + formulario de magic link (Server Actions), acepta ?callbackUrl (validado, solo rutas propias)
  entrar/revisa-tu-correo/page.tsx # pantalla post-envío del magic link
  mis-fotos/page.tsx              # galería del usuario autenticado, paginada por cursor
  procesando/[jobId]/page.tsx     # wrapper del poller — mensajes de espera honestos según el tipo
  resultado/[jobId]/page.tsx      # muestra imagen o <video> según Job.type + botones
  comprar/[packageId]/page.tsx    # destino de callbackUrl tras /entrar — retoma el checkout de ese paquete automáticamente
  gracias/page.tsx                # post-pago: sondea /api/checkout/status hasta que el webhook confirma; nunca acredita nada
  api/
    auth/[...nextauth]/route.ts   # handlers de Auth.js
    jobs/route.ts                 # POST → sube a Blob y a fal.storage, crea job + descuenta crédito, submitRestore
    jobs/[jobId]/route.ts         # GET → estado del job, valida dueño contra la DB (await params)
    image/[jobId]/route.ts        # GET → proxy autenticado: valida dueño, reenvía Range al blob y streamea la respuesta (206 si aplica) sin bufferear en memoria. v=input/output/poster
    credits/route.ts              # GET → balance real de la DB
    checkout/route.ts             # POST → crea sesión de Stripe Checkout (price_data desde lib/pricing.ts), requiere sesión
    checkout/status/route.ts      # GET → ¿ya existe un CreditTransaction con este externalId? — solo lectura, usada por /gracias
    webhooks/falai/route.ts       # POST → verifica firma, procesa OK/ERROR, encadena restore→animate, reembolsa en fallos
    webhooks/stripe/route.ts      # POST → verifica firma, acredita créditos idempotente, dispara Purchase por Meta CAPI
    cron/cleanup/route.ts         # GET, protegida por CRON_SECRET — borra blobs+Jobs con más de RETENTION_DAYS, preserva CreditTransaction
vercel.json                       # cron diario de /api/cron/cleanup
components/
  JsonLd.tsx                      # Organization + WebSite + FAQPage (derivado de FAQ_ITEMS, sin duplicar)
  MetaPixel.tsx                   # gated en NEXT_PUBLIC_FB_PIXEL_ID — no renderiza nada si falta. Solo PageView + ViewContent; Purchase será CAPI server-side
  legal/LegalPage.tsx             # layout compartido de las 3 páginas legales
  layout/Header.tsx               # Server Component — lee créditos reales de la DB + sesión
  layout/HeaderNav.tsx            # Client Component — badge de créditos, cuenta/avatar, drawer móvil
  layout/Footer.tsx               # links de navegación + legales
  landing/
    Hero.tsx                      # slider hero-antes/despues.jpg + CTA primario
    Ejemplos.tsx                  # 3 sliders de lib/ejemplos.ts
    HowItWorks.tsx                # pasos numerados
    Pricing.tsx                   # PackageCard × 3, importa lib/pricing.ts
    FAQ.tsx                       # Accordion con preguntas frecuentes — exporta FAQ_ITEMS (fuente única para el JSON-LD)
  ui/
    BeforeAfterSlider.tsx         # pointer events + clip-path; onError → ImageFallback con ruta
    PhotoUploader.tsx             # drag & drop + preview + selector restore/animate
    PackageCard.tsx               # 'use client' — calcula equivalencias, botón inicia checkout real vía lib/checkout-client.ts
    ProgressStages.tsx            # poller cada 2s, etapas restoring/animating reales → redirige a /resultado/[jobId]
    SectionHeading.tsx            # OBLIGATORIO para h2 de sección — corrige preflight de Tailwind v4
    Accordion.tsx                 # FAQ items con animación max-height
    ShareButton.tsx               # botón de compartir resultado
    DownloadButton.tsx            # descarga vía fetch+blob con loader — necesario para video (varios MB)
    VideoPlayer.tsx                # 'use client' — <video> sobre /api/image?v=output (con Range), poster = restauración, estado de carga/buffering visible, reintento
    StickyMobileCta.tsx           # CTA fijo en móvil tras pasar el hero, oculto en /crear, /procesando, /resultado
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
| Créditos | **Funcionando** — descuento atómico en transacción (`lib/jobs.ts` `createJobAndCharge`), auditable vía `CreditTransaction`. Prioridad de tier corregida: crédito suficiente siempre gana sobre el free tier, ver sección "Prioridad tier PAID vs. FREE" |
| Almacenamiento de imágenes y video | **Funcionando** — Vercel Blob (`lib/storage.ts`), servidas solo vía proxy autenticado `/api/image/[jobId]`. El proxy reenvía `Range` (206 + `Content-Range`) y streamea sin bufferear en memoria — ver "Entrega de video" en la sección Seguridad para el problema real que esto resolvió y los números medidos |
| Modelos y prompts de IA | **Funcionando** — integrados en `lib/fal.ts`, validados a mano en el sandbox de fal (ver sección siguiente) y confirmados en vivo contra la API real de fal |
| Procesamiento | **Funcionando** — cola de fal (`fal.queue.submit`) + webhook (`/api/webhooks/falai`), sin polling síncrono. RESTORE es una llamada; ANIMATE encadena restauración (siempre modelo PAID) → animación, correlacionadas por `Job.falRequestId` (único, se reescribe en cada salto de etapa) |
| Verificación de webhooks | **Funcionando** — ED25519 contra el JWKS de fal (`lib/fal-verify.ts`), timestamp con ventana de 5 min contra replay |
| Vista previa gratuita | **Funcionando** — `lib/watermark.ts` (sharp) reduce resolución y aplica marca de agua antes de guardar en Blob |
| Reembolsos | **Funcionando** — si fal devuelve error, el payload no tiene el formato esperado, o pasan 15 min sin respuesta (timeout perezoso en `getJobForUser`), el job pasa a FAILED y se reembolsa el crédito (o se revierte `freeUsed`) de forma atómica e idempotente |
| Imágenes de resultado | **Funcionando** — descargadas de fal (URLs `v3.fal.media`, temporales) y re-subidas a Vercel Blob antes de responder al usuario |
| Pago / Stripe | **Funcionando (solo tarjetas)** — `POST /api/checkout` crea una sesión de Stripe Checkout hospedada (`price_data` en línea desde `lib/pricing.ts`, nunca Productos/Precios del dashboard); requiere sesión iniciada, un usuario anónimo se manda a `/entrar?callbackUrl=/comprar/[packageId]` y `/comprar/[packageId]` retoma el checkout solo al volver, sin perder el paquete elegido. `POST /api/webhooks/stripe` verifica la firma con `STRIPE_WEBHOOK_SECRET` sobre el body crudo, acredita con `addCreditsFromPurchase()` (`lib/credits.ts`) dentro de una transacción corta, e idempotencia real vía `CreditTransaction.externalId` con restricción `@unique` (el `INSERT` falla con P2002 en un reintento, no un `findFirst` previo). `/gracias` sondea `GET /api/checkout/status` cada 2s hasta que el webhook confirma (o hasta 30s, sin tratarlo como error) y nunca acredita nada por sí misma. `Purchase` se dispara server-side por Meta CAPI (`lib/meta-capi.ts`) si `META_CAPI_TOKEN` está definido; si no, se omite en silencio. Probado en vivo contra la DB real con eventos firmados de Stripe: acreditación exacta una vez, reenvío del mismo webhook sin duplicar, firma inválida rechazada con 400, metadata corrupta (paquete inexistente) ack 200 sin acreditar y logueada para revisión manual, `/api/checkout` sin sesión devuelve 401. **Pendiente de correr contra el sandbox real de Stripe con el Stripe CLI** (la cuenta de la CLI en esta máquina no es la misma que la de `STRIPE_SECRET_KEY` — ver comentario en `.env`) antes de dar por buena la integración de punta a punta con una tarjeta real de prueba. Mercado Pago (OXXO/SPEI) queda fuera de esta iteración a propósito — `addCreditsFromPurchase` ya está diseñada para que un segundo proveedor solo aporte su propio `externalId`, sin rediseñar la acreditación. |
| Borrado a 30 días | **Funcionando** — `app/api/cron/cleanup/route.ts` + `vercel.json` (cron diario 9:00 UTC). Borra blobs de entrada/salida/intermedios y el `Job` de jobs con más de `RETENTION_DAYS` (30, `lib/jobs.ts`, fuente única compartida con `/mis-fotos`); preserva `CreditTransaction` vía `onDelete: SetNull`. Tolerante a fallos parciales: si un blob falla, ese job completo se deja para la corrida siguiente en vez de arriesgar un blob huérfano. Probado en vivo contra la DB y el Blob reales: job con 31 días de antigüedad (3 blobs: input/restored/output) borrado correctamente, `CreditTransaction` asociado sobrevive con `jobId: null`, job reciente intacto, 401 sin auth o con secreto incorrecto, segunda corrida idempotente (0 jobs encontrados) |
| Dominio canónico | **Decidido: `www.revivelos.com`** — `revivelos.com` (apex) ya redirige 308 a `www` en Vercel, así que apuntar el canonical al apex generaría un canonical que a su vez redirige. `metadataBase`, `robots.ts`, `sitemap.ts`, `llms.txt`, `JsonLd.tsx` actualizados. `AUTH_URL`/`NEXT_PUBLIC_BASE_URL` de producción deben usar este mismo host — ver checklist de despliegue |
| Bloqueo de indexación fuera de producción | **Funcionando** — `robots.ts` ahora es dinámico (`headers()`) y compara el `Host` real de la petición contra `www.revivelos.com`; cualquier otro host (incluido el alias autogenerado `*.vercel.app`, que también reporta `VERCEL_ENV=production` y por eso no basta con solo esa variable) recibe `Disallow: /`. Probado en vivo simulando los 3 hosts con `curl -H "Host: ..."` |
| Imágenes de /public/ejemplos/ | **Agregadas** — `hero-antes/despues.jpg`, `1/2/3-antes/despues.jpg`, `video-animated.mp4` y sus miniaturas ya existen en el repo |
| Páginas legales (privacidad/términos/reembolsos) | **Funcionando como borrador** — contenido real conforme a LFPDPPP y Profeco, pero marcado explícitamente como no revisado por abogado (comentario al inicio de cada archivo). **No publicitar ni cobrar sin esa revisión.** |
| Metadatos y compartir (OG/Twitter, robots, sitemap, manifest, JSON-LD) | **Funcionando** — imagen de compartir generada con `next/og` a partir de fotos reales (`lib/og-image.tsx`), título único por página vía `title.template`, `FAQPage` derivado de `FAQ_ITEMS` sin duplicar |
| Rate limiting, validación de archivos, cabeceras de seguridad/CSP | **Funcionando** — ver sección "Seguridad" más abajo. Probado en vivo: bloqueo real a la 5ta foto/hora por IP, al 4to magic link/hora al mismo correo, y rechazo de un archivo con extensión `.jpg` que no era una foto real |
| Tope diario del free tier | **Funcionando** — `FREE_TIER_DAILY_CAP` (default 200) + kill switch `FREE_TIER_ENABLED`, ver sección "Seguridad" más abajo. Probado en vivo con cap=2: 3er intento del día lanza `FreeTierUnavailableError`, un usuario con crédito sigue procesando PAID sin problema |
| Páginas de error/carga, CTA fijo móvil, alt text real, analítica (Vercel Analytics + Speed Insights), Pixel de Meta, accesibilidad, `next/image` en landing, SEO (landings por servicio, `/acerca`, `llms.txt`, canonical, sitemap) | **Funcionando** — ver detalle abajo |
| Contenido legal adicional (aviso de IA, retiro de contenido, jurisdicción, Pixel en privacidad, garantía de reembolso visible, espacio de logos de pago) | **Funcionando como borrador**, misma salvedad de revisión legal que el resto de `/privacidad` `/terminos` `/reembolsos` |

**Pendiente de verificar antes de producción:** los nombres exactos de los parámetros de input de cada modelo de fal (`image_urls` vs `image_url`, nombre del flag de audio) se implementaron según la convención más documentada y se confirmaron en vivo para `nano-banana*/edit` (`image_urls: string[]`) contra la API real; falta correr un job ANIMATE real de punta a punta para confirmar el input de `kling-video/.../image-to-video`.

### Detalle de la ronda de pulido — páginas de error, CTA, analítica, accesibilidad, SEO

- **Páginas de error/carga:** `not-found.tsx`, `error.tsx` (Client Component con `reset()`), `global-error.tsx` (reemplaza `<html>`/`<body>` completos, sin depender de `globals.css` por si el layout raíz es lo que falló — estilos inline con los valores del sistema de diseño), `loading.tsx` genérico con el spinner ya usado en `PhotoUploader`. El estado FAILED de un job sigue mostrando su propio `ErrorView` dentro de `/resultado/[jobId]` — no cae en el `error.tsx` genérico, se re-verificó explícitamente.
- **CTA fijo móvil:** `StickyMobileCta.tsx`, aparece pasado `70vh` de scroll (umbral fijo, no mide el DOM porque no todas las páginas tienen un Hero), oculto por prefijo de ruta en `/crear`, `/procesando`, `/resultado`. Probado en vivo: 0 apariciones del texto del CTA en `/crear`.
- **Alt text real:** `lib/ejemplos.ts` ahora tiene `beforeAlt`/`afterAlt` por ejemplo describiendo el daño y la restauración real; `BeforeAfterSlider` los usa si existen, si no cae a `beforeLabel`/`afterLabel` genéricos (usado así en `/resultado`, donde no hay forma de saber el contenido de la foto del usuario de antemano).
- **`next/image`:** adoptado en `BeforeAfterSlider`, `Hero` (con `priority`, único uso de `priority` del sitio) y `Ejemplos`. **Excepción deliberada:** `/resultado/[jobId]` pasa `unoptimized` porque sirve `/api/image/[jobId]`, una ruta protegida por cookie — el optimizador de imágenes de Next hace un fetch server-a-server que **no reenvía las cookies del usuario**, así que optimizar esa URL rompería la carga en producción. Mismo motivo por el que `/mis-fotos` sigue usando `<img>` crudo con el lint suprimido explícitamente.
- **Analítica:** `@vercel/analytics` + `@vercel/speed-insights` instalados y montados en `layout.tsx`.
- **Meta Pixel:** `components/MetaPixel.tsx`, `next/script` con `strategy="afterInteractive"` — por eso no aparece en el HTML servido por el servidor (`curl`), se inyecta client-side tras hidratar; confirmado por código, no por captura de red en vivo (la extensión de navegador para pruebas no respondió en esta sesión). Dispara `PageView`+`ViewContent` una vez al cargar, y `PageView` de nuevo en cada cambio de ruta client-side. `Purchase` queda pendiente para cuando exista CAPI server-side (Fase 3).
- **SEO:** `/restaurar-fotos-antiguas`, `/animar-fotos-en-video` (con la limitación honesta de 1-2 personas explícita) y `/acerca` — cada una con su propio H1, metadata y `alternates.canonical`. `llms.txt` servido como texto plano vía Route Handler. `sitemap.ts` actualizado con las 3 páginas nuevas. Páginas privadas/transaccionales (`/mis-fotos`, `/resultado/*`, `/procesando/*`, `/entrar/revisa-tu-correo`) llevan `robots: { index: false, follow: false }` en vez de canonical — ya estaban fuera de `robots.txt`, pero el meta tag evita que aparezcan indexadas sin contenido si alguien las enlaza desde fuera.
- **Contenido legal adicional:** aviso de IA agregado a `/terminos` (sección 4, ya existía) **y** visible en `/crear` mismo (no solo en la página legal); cláusula de retiro de contenido (`/terminos` sección 5.1, nueva); jurisdicción mexicana sin cláusula de arbitraje (`/terminos` sección 9, ya existía, confirmada sin cambios); aviso de Pixel en `/privacidad` (sección 6, ya existía); garantía de reembolso visible junto a precios (`Pricing.tsx`, enlaza a `/reembolsos`); línea de "pago seguro con tarjeta, procesado por Stripe" junto a precios ahora que el checkout funciona de verdad.

**Hallazgo de accesibilidad — resuelto (2026-08-16):** la escala ámbar se recorrió un escalón: `--color-amber` tomó el valor que antes tenía `--color-amber-dark` (#A8640A), y `--color-amber-dark` bajó a un tono nuevo (#8A5208) para hover/active. Ratios verificados con `chroma-js` (`chroma.contrast`), no a ojo:

| Combinación | Ratio | WCAG AA |
|---|---|---|
| `.btn-primary` — blanco sobre amber | 4.67:1 | ✅ (necesita 4.5:1) |
| `.btn-primary:hover` — blanco sobre amber-dark | 6.38:1 | ✅ |
| Enlaces — amber-dark sobre cream | 5.93:1 | ✅ |
| Enlaces — amber-dark sobre warm-white | 6.09:1 | ✅ |
| Texto secundario — bark-muted sobre cream | 5.66:1 | ✅ (sin cambios, ya pasaba) |
| `.btn-secondary` borde — amber sobre warm-white (no-texto, pide 3:1) | 4.46:1 | ✅ |

`.btn-secondary` también cambió: su texto usaba `var(--color-amber)` directamente, que da solo 4.34:1 sobre crema — insuficiente para texto normal (aunque sí alcanza el 3:1 que pide un borde). Su `color` ahora usa `--color-amber-dark`; el borde se queda en `--color-amber`. `--shadow-amber` y los hex hardcodeados fuera de `globals.css` (`app/manifest.ts` `theme_color`, `app/global-error.tsx`, `lib/og-image.tsx`, `lib/email.ts` — ninguno puede leer variables CSS: satori, el fallback de error raíz, y el HTML de email no las soportan) se actualizaron al mismo `#A8640A` por consistencia visual.

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

### Fase 3 — Monetización y growth ✅ Stripe hecho, Mercado Pago pendiente
- **Stripe** (tarjetas) ✅ hecho — `POST /api/checkout` + `POST /api/webhooks/stripe`, ver tabla de estado. **Mercado Pago** (OXXO, SPEI, tarjetas locales) queda para una siguiente iteración: el comprador de 55 años muchas veces no mete tarjeta, así que sigue siendo importante, solo que no bloqueó esta ronda. `addCreditsFromPurchase()` en `lib/credits.ts` ya está diseñada para que agregarlo sea solo un nuevo caller con su propio `externalId`, no una reescritura.
- Webhook de pago → acreditar en `CreditTransaction` ✅ hecho, idempotente vía `CreditTransaction.externalId` único.
- **Meta Pixel + CAPI server-side** ✅ hecho — `Purchase` se dispara desde `app/api/webhooks/stripe/route.ts` vía `lib/meta-capi.ts` al confirmar el pago (requiere `META_CAPI_TOKEN`, se omite en silencio si falta). `InitiateCheckout` se dispara del lado del cliente al iniciar el checkout.

El resto de la Fase 3 (cron de limpieza, dominio propio, preparación de producción) ya está hecho — ver "Estado real vs. pendiente" y la sección "Despliegue a producción" más abajo. Lo que falta para cerrar la Fase 3 por completo es Mercado Pago, y correr la compra con tarjeta real contra el sandbox de Stripe con la cuenta correcta en la CLI (ver nota en la tabla de estado).

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

### Prioridad tier PAID vs. FREE

**Quien tiene crédito suficiente para la operación siempre paga con crédito y recibe PAID — sin importar si su restauración gratis (`freeUsed`) sigue disponible.** El free tier es el último recurso, nunca el primero. Esta es la regla completa, en orden:

1. `user.credits >= costo de la operación` → cobra crédito, tier `PAID`, sin marca de agua. `freeUsed` no se toca.
2. Si no alcanza el crédito, la operación es `restore` (nunca `animate` — un video jamás cabe en el free tier) y `freeUsed` sigue en `false` → tier `FREE`, con marca de agua, `freeUsed` pasa a `true`.
3. Si ninguna de las dos aplica → `InsufficientCreditsError` (saldo insuficiente).

**Hubo un incidente real por invertir este orden:** la primera versión decidía `isFreeRestore = type === 'restore' && !user.freeUsed`, sin mirar el saldo — así que cualquier usuario que aún no hubiera gastado su gratis recibía SIEMPRE el resultado barato con marca de agua al pedir una restauración, incluso con crédito de sobra en la cuenta. Un usuario que compró 5 créditos, gastó 3 en un video y pidió una restauración con 2 créditos disponibles recibió una vista previa gratuita en vez de que se le cobrara 1 crédito. Corregido evaluando primero `user.credits >= cost` (`lib/jobs.ts` → `createJobAndCharge`) y solo cayendo a `isFreeRestore` cuando el crédito no alcanza.

**Un solo lugar decide el tier: `createJobAndCharge` en `lib/jobs.ts`.** Nada más en el código — ni la ruta `POST /api/jobs`, ni `PhotoUploader.tsx`, ni ningún componente de UI — vuelve a calcular o adivinar qué tier le va a tocar a un job; el cliente solo manda `type` (`restore`/`animate`), nunca decide qué se le cobra. La etiqueta "Gratis la primera vez" del selector de acción en `/crear` es puramente informativa: `app/crear/page.tsx` lee el saldo real (`getBalance`) y le pasa `hasCredits` a `PhotoUploader`, que muestra "N créditos" en vez de "Gratis" cuando `hasCredits` es `true` — para no prometerle "gratis" a alguien que en realidad va a pagar con crédito. Si ese saldo cambiara entre que se pinta la página y que se sube la foto, la fuente de verdad sigue siendo `createJobAndCharge`; la etiqueta nunca se usa para decidir el cobro.

Probado en vivo contra la DB real (`createJobAndCharge` invocado directamente): créditos>0 + free sin usar + restore → PAID, descuenta, `freeUsed` intacto; créditos=0 + free sin usar + restore → FREE, marca de agua, `freeUsed→true`; créditos=0 + free usada + restore → error; créditos=2 + free sin usar + animate (cuesta 3) → error, NO degrada a free; créditos=3 + free sin usar + animate → PAID, descuenta 3; y la reproducción exacta del incidente (comprar 5 → gastar 3 en video → restaurar con 2 restantes) → ahora da PAID, sin marca de agua, `freeUsed` se mantiene en `false` para cuando sí se necesite.

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
9. **Single source of truth**: costos y créditos → `lib/pricing.ts`; ejemplos → `lib/ejemplos.ts`; modelos y prompts de IA → `lib/fal.ts` + env. Nunca hardcodear. Por la misma razón, `POST /api/checkout` construye la sesión de Stripe con `price_data` en línea leído de `PACKAGES` — nunca se crean Productos ni Precios en el dashboard de Stripe. Si el precio viviera en dos lugares (código y dashboard), algún día se van a desincronizar: alguien cambia `lib/pricing.ts` para una promoción y se le olvida el dashboard (o al revés), y el usuario paga un monto distinto al que ve en `/#precios`. Con `price_data` en línea eso es estructuralmente imposible.
10. **La vista previa gratuita se comunica como vista previa** — y la comparación que la justifique debe ser de fotos reales procesadas con ambos modelos, no una diferencia exagerada. Misma regla que los testimonios.

---

## Seguridad

### Auditoría de autorización (hecha en la fase de pulido)

Se revisó cada ruta de API y cada página que muestra datos de un usuario, verificando que nada confíe en un id de la URL sin validar dueño contra el usuario resuelto server-side (`getUserId()` / `auth()`):

| Ruta/página | Resultado |
|---|---|
| `POST /api/jobs` | ✅ `userId` sale de `getUserId()`, nunca del cliente |
| `GET /api/jobs/[jobId]`, `GET /api/image/[jobId]` | ✅ `getJobForUser` valida `job.userId === userId` antes de devolver nada |
| `GET /api/credits` | ✅ escoping por `getUserId()` |
| `/resultado/[jobId]`, `/procesando/[jobId]` | ✅ usan `getJobForUser` |
| `/mis-fotos` | ✅ `where: { userId: session.user.id }` — **hallazgo real, ya corregido**: el `cursor` de paginación no se validaba contra el dueño. Prisma ubica la fila del cursor por id único *sin* aplicar el `where`, así que un cursor con el id de un job ajeno servía como punto de partida (no exponía datos ajenos, pero sí era un oráculo de existencia/fecha). Se agregó una verificación de propiedad del cursor antes de usarlo. |
| `POST /api/webhooks/falai` | ✅ autorizado por firma ED25519, no por usuario — correcto para un webhook servidor-a-servidor |

### Entrega de video (rendimiento de `/resultado`)

**El problema real:** el usuario ya esperó 2-3 minutos por la generación y luego volvía a esperar a que el video cargara en `/resultado`. Causa confirmada — no solo sospechada, medida contra la DB y el Blob reales: la implementación original de `GET /api/image/[jobId]` hacía `await blobResponse.arrayBuffer()` y recién entonces construía la respuesta. Eso significa que la función serverless no le manda **ni un byte** al navegador hasta tener el archivo completo en memoria — para un video de ~5MB, ninguna optimización del lado del cliente (`preload`, `poster`, lo que sea) puede compensar eso.

**Arreglado — dos cambios en `app/api/image/[jobId]/route.ts`:**
1. Reenvía el header `Range` de la petición al `fetch` contra el Blob, y responde `206 Partial Content` con `Content-Range` y `Accept-Ranges: bytes` cuando el Blob devuelve un rango parcial.
2. La respuesta ya no bufferea (`arrayBuffer()` → `Uint8Array`) — se reenvía `blobResponse.body` (un `ReadableStream`) directo como `BodyInit`, así que el streaming empieza en cuanto llegan los primeros bytes del Blob, con o sin `Range`.

El segundo punto termina siendo el más importante de los dos: incluso una petición completa (sin `Range`) ya no espera a bufferear todo el archivo.

**Medido en vivo** (job real con el video de ejemplo de 4.9MB subido al Blob de este proyecto, servido por el proxy autenticado, validación de dueño intacta):

| Escenario | Antes (buffer completo) | Después |
|---|---|---|
| Escritorio, sin límite de ancho de banda — tiempo hasta el primer byte | 6.4s (tiene que bufferear los 4.9MB enteros antes de mandar nada) | 0.30-0.35s |
| 3G lento simulado (~50KB/s, perfil "Slow 3G" de Chrome DevTools) — tiempo hasta tener disponible el rango que el reproductor necesita | 95.7s (tiempo total: solo entrega el archivo completo, de una sola vez) | 1.3-1.9s (petición `Range` de 8-64KB) |

**Hallazgo adicional, específico de este video de ejemplo:** el `moov` atom (el índice que el navegador necesita antes de poder decodificar cualquier cuadro) está al final del archivo, no al principio — el mp4 no tiene el flag `faststart`. Sin `Range`, el navegador no tiene alternativa a descargar el archivo completo, de principio a fin, antes de poder reproducir nada, sin importar cuánto se optimice el resto. Con `Range`, el navegador (o su demuxer) puede pedir directamente los últimos KB donde vive el `moov` — medido en 1.3s a 50KB/s, contra los 95.7s que tomaba la versión anterior. Esto hace que el punto 1 (Range) sea la mitigación estructural real, más allá de cualquier ajuste de UI.

**Descartado — URL firmada de corta duración (bypasear el proxy):** Vercel Blob sí soporta esto (`issueSignedToken` + `presignUrl`, ambos en `@vercel/blob@2.8.0`), pero requiere que el *store* esté configurado como `private` — un store `public` (el de este proyecto, `store_WcvhxXP51xeYUHmD`) rechaza `access: 'private'` por objeto con `BlobError: Cannot use private access on a public store`. Migrar de store es un paso manual en el dashboard de Vercel, no algo que el código pueda decidir por su cuenta — **queda pendiente**. Si en el futuro se provisiona un store privado para video: `lib/storage.ts` necesitaría un `access` opcional en `put()` y un método `getSignedUrl(pathname, ttlSeconds)` (implementados y probados en esta ronda, luego revertidos junto con la columna `Job.outputPathname` que los acompañaba, precisamente por este bloqueo); el trade-off a documentar en ese momento: la URL firmada es adivinable durante su vigencia (unos minutos), pero la exposición es corta y el contenido son 5 segundos de una foto familiar — no un dato sensible.

**Póster:** `toApiJob` expone `posterUrl` (`/api/image/[jobId]?v=poster`) para jobs `animate` completos, reutilizando `Job.restoredUrl` — la restauración intermedia que ya se guarda antes de animar. No se generó ni se guardó ninguna imagen nueva para esto.

**Reproductor:** `components/ui/VideoPlayer.tsx` — `preload="metadata"`, `playsInline`, `muted`, `loop`, `autoPlay`, `poster`. Spinner + "Cargando tu video…" superpuesto mientras el video no está listo (`onWaiting`/`onCanPlay`/`onPlaying`) o mientras hace buffer — nunca un rectángulo negro sin explicación. Si el elemento `<video>` dispara `onError`, se ofrece un botón de reintentar que solo llama a `videoRef.current.load()` (mismo `src`, la URL del proxy no expira).

**Compresión al guardar (evaluado, no implementado):** con `ffmpeg` local (`libx264`, `-crf 28 -preset veryfast -movflags +faststart`, sin audio — el video ya se genera sin audio) el mismo video de ejemplo bajó de 4.9MB a ~400KB (~92% menos), en 1.2s de proceso en una laptop M-series. La calidad visual a ese CRF es aceptable para un preview de 5 segundos, pero no se validó formalmente contra el mismo set de 5 fotos que se usó para elegir los modelos de IA. **No se agregó como dependencia** porque el pedido explícito era reportar el costo antes de instalarla: hace falta un binario de `ffmpeg` empaquetado para el runtime serverless de Vercel (paquetes como `ffmpeg-static` o `@ffmpeg-installer/ffmpeg`, o `fluent-ffmpeg` como wrapper) — eso agrega binarios nativos por plataforma al bundle de la función (decenas de MB) y varios segundos de latencia por video dentro de `handleFinalSuccess` en el webhook (que ya descarga + a veces aplica marca de agua, con `maxDuration = 60`). El beneficio es real y grande (92% menos peso → carga aún más rápida, y de regalo `+movflags faststart` resuelve el hallazgo del `moov` al final sin depender de `Range`), pero es una decisión de infraestructura que requiere aprobación explícita antes de sumar la dependencia — pendiente.

No se encontró ningún IDOR real (acceso a datos ajenos). El único hallazgo fue el oráculo de cursor en `/mis-fotos`, de severidad baja, ya corregido.

### Rate limiting

Implementado en Postgres (`lib/rate-limit.ts`, tabla `RateLimitHit`), **sin Redis**. Ventana fija: `key` + `windowStart` (redondeado hacia abajo) como PK compuesta, `upsert` atómico que incrementa el conteo — dos requests simultáneas en la misma ventana nunca se pisan porque es un solo statement, no un "leer, sumar, escribir".

**Trade-off vs. Redis/Upstash**, explicado porque se decidió activamente en contra: Postgres añade un round-trip a la DB por request limitado (Upstash con edge caching sería más rápido), pero no agrega un servicio externo nuevo, ni credenciales, ni una dependencia — ya tenemos Postgres. Para el volumen de tráfico de este producto (B2C de Meta ads, no alto QPS) es la opción correcta; si el tráfico crece un orden de magnitud, Upstash Redis es el siguiente paso natural sin tener que rediseñar la interfaz (`checkRateLimit`/`checkRateLimits` ya son agnósticas del backend).

Límites aplicados:
- `POST /api/jobs` — el más estricto: **5 por IP/hora** y **10 por usuario/hora**. Es el que protege el gasto real en fal — un script que borra su cookie en loop para seguir cobrando la gratis lo bloquea por IP, no por usuario (un uid nuevo es gratis de crear).
- `POST /api/auth/signin/resend` (magic link) — **5 por IP/hora** y **3 por correo destino/hora**, para que no se pueda bombardear un correo ajeno con enlaces no pedidos. Interceptado en `app/api/auth/[...nextauth]/route.ts` antes de delegar a `handlers.POST`.
- Resto de la API (`GET /api/jobs/[jobId]`, `/api/image/[jobId]`, `/api/credits`) — límite general holgado, **300 por IP/10 min** (`enforceGeneralRateLimit`). Tiene que caber cómodo el polling de `ProgressStages` (cada 2s durante varios minutos en un video) y solo cortar scraping/bots evidentes.
- Respuesta siempre `429` con `Retry-After` y un mensaje humano (nunca un error crudo), `code: 'RATE_LIMITED'`.
- Limpieza: `maybeCleanupOldHits()` borra ventanas viejas con 1% de probabilidad en cada hit de `/api/jobs` — no sustituye un cron real (pendiente junto con el resto de limpieza de Fase 3), pero evita que la tabla crezca sin límite mientras tanto.

### Tope global de gasto diario del free tier

El rate limiting de arriba protege contra **abuso** (un script insistiendo), pero no contra el **éxito**: si un anuncio funciona y llegan miles de usuarios legítimos el mismo día, cada uno con su propia IP, cada free preview cuesta fal real y nada de lo anterior lo frena. Este control es distinto — pone un techo al gasto total del día, sin importar cuántos usuarios distintos lo generen.

**Dónde vive la verificación:** dentro de `createJobAndCharge` en `lib/jobs.ts`, en el mismo bloque de la misma transacción donde se decide `isFreeRestore` — antes de reclamar el fingerprint, antes de crear el `Job`, y muy antes de que cualquier código llame a fal (`app/api/jobs/route.ts` recién sube la imagen a fal *después* de que `createJobAndCharge` retorna con éxito). El check solo corre cuando esta generación en particular sería gratis (`type === 'restore' && !user.freeUsed`); una generación de pago nunca ejecuta esta rama, así que **nunca puede bloquearla** — quien ya tiene crédito siempre recibe su resultado, sin excepción.

La cuenta se hace contra la tabla `Job` que ya existe (`tier: 'FREE'` + `createdAt` de hoy en UTC), sin agregar ninguna tabla ni estado nuevo:

```ts
const freeToday = await tx.job.count({
  where: { tier: 'FREE', createdAt: { gte: startOfTodayUTC() } },
})
if (freeToday >= FREE_TIER_DAILY_CAP) throw new FreeTierUnavailableError()
```

Si el tope ya se alcanzó (o si `FREE_TIER_ENABLED=false`, el kill switch de emergencia), se lanza `FreeTierUnavailableError` — **no** se degrada en silencio a cobrar un crédito, porque eso sería cobrarle a alguien sin que lo supiera de antemano. `app/api/jobs/route.ts` la traduce a `{ code: 'FREE_TIER_UNAVAILABLE' }` con status 429 y el mensaje *"Hoy ya alcanzamos el límite de pruebas gratuitas. Vuelve mañana o compra créditos para continuar."*; `PhotoUploader.tsx` la muestra en una caja con CTA a `/#precios` — nunca un error crudo.

**Qué le pasa a un usuario que ya empezó su job cuando el tope se alcanza a la mitad del proceso:** nada. El check corre una sola vez, en el momento de crear el job (`createJobAndCharge`), dentro de una transacción que ya cuenta ese mismo job como parte de `freeToday` en cuanto se confirma. Ningún otro punto del pipeline — el webhook de fal, `failJobAndRefund`, las transiciones de etapa — vuelve a evaluar el tope. Así que si el conteo del día llega al límite un segundo después de que a alguien ya se le creó y cobró (gratis) su job, ese job corre hasta terminar con total normalidad; el tope solo bloquea *intentos nuevos* de creación a partir de ese momento.

Configuración: `FREE_TIER_DAILY_CAP` (default 200 si no está seteada o no es un número — ver `Number(...) || 200` en `lib/jobs.ts`) y `FREE_TIER_ENABLED` (cualquier valor distinto a la cadena `'false'` cuenta como activado). Ambas se leen en cada invocación, sin caché — cambiar el valor en Vercel y redesplegar (o, en plataformas con env vars en caliente, sin siquiera eso) basta para ajustar el tope o apagar el free tier sin tocar código.

Probado en vivo contra la DB real con `FREE_TIER_DAILY_CAP=2`: los primeros 2 jobs FREE del día se crean con `tier: 'FREE'`; el 3er intento lanza `FreeTierUnavailableError`; un usuario con crédito (`freeUsed: true`, 5 créditos) crea su job como `PAID` y su saldo baja a 4 sin verse afectado por el cap. También probado el kill switch (`FREE_TIER_ENABLED=false`): cualquier intento de free tier lanza el mismo error, sin importar el conteo del día.

### Validación de entradas

`lib/file-validation.ts` — la foto subida se valida por **magic bytes** (primeros bytes del archivo), nunca por `Content-Type` (lo manda el cliente) ni por extensión del nombre. Firmas reconocidas: JPEG, PNG, WEBP, HEIC/HEIF (caja `ftyp` de ISOBMFF). Límite de tamaño de 15MB reforzado **server-side** (antes solo existía en `PhotoUploader.tsx`, trivial de saltarse con un POST directo). El correo del formulario de magic link se valida con regex server-side en el Server Action de `/entrar` antes de llamar a `signIn()` — el `type="email"` del navegador no protege nada si se hace un POST directo.

### CORS

Confirmado, sin cambios de código necesarios: ninguna ruta de API define cabeceras `Access-Control-Allow-Origin`. El comportamiento default de los Route Handlers de Next.js ya es same-origin-only para requests con credenciales (cookies) — un origen externo no puede leer la respuesta de `/api/jobs`, `/api/credits`, etc. El webhook de fal (`/api/webhooks/falai`) es server-a-servidor y se protege por firma ED25519 (`lib/fal-verify.ts`), no por CORS — correcto, ya que un webhook nunca llega con las cookies del usuario de todos modos.

### Magic link — vigencia del token

Confirmado en el código de `@auth/core`: el default de Auth.js para el provider Email es **24 horas**. Se acortó a **1 hora** (`Resend({ maxAge: 60 * 60 })` en `lib/auth.ts`) — 24h es una ventana larga para un enlace de login sin contraseña si el correo se filtra o queda abierto en un dispositivo compartido; 1h sigue siendo cómodo para que alguien de 60 años revise su correo sin apuro.

### Cabeceras de seguridad y CSP

`next.config.ts` → `headers()`. Incluye `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` y una CSP con `frame-ancestors 'none'`, `object-src 'none'`, `img-src`/`connect-src` permitiendo `facebook.net`/`facebook.com` (Pixel de Meta) además de `'self'`. `img-src` también incluye `blob:` — sin eso, la vista previa local de `PhotoUploader.tsx` (`URL.createObjectURL()`, antes de subir la foto a ningún lado) nunca pinta; el navegador no lo reporta como error visible, solo se ve en que `naturalWidth` del `<img>` se queda en 0. Bug real detectado y corregido en producción de esta ronda — si se toca `img-src` en el futuro, probar `/crear` subiendo una foto de verdad, no solo build/lint.

**Decisión explícita: CSP sin nonces**, con `'unsafe-inline'` en `script-src` y `style-src`. Next.js recomienda CSP con nonce para bloquear inline scripts por completo, pero eso **exige que toda página se renderice de forma dinámica** (desactiva la generación estática) — un costo real para la landing, que es justo la página que más importa que cargue rápido viniendo de anuncios de Meta. Además, `style={{...}}` se usa en casi todo el sistema de diseño de este proyecto en vez de clases, lo que de todos modos requeriría `'unsafe-inline'` en `style-src` aunque se adoptara nonce para scripts. Si en el futuro se necesita CSP estricta (por ejemplo, por una auditoría de seguridad externa), la migración a nonces está documentada en los docs de Next.js de este mismo repo (`node_modules/next/dist/docs/.../content-security-policy.md`).

---

## Panel de administración

`/admin` — dashboard interno de una sola persona (el dueño del negocio), pensado sobre todo para vigilar las primeras campañas de Meta ads sin entrar a la DB a mano. Solo lectura salvo el ajuste manual de créditos.

**Auth propia, deliberadamente separada de Auth.js** (`lib/admin-auth.ts`): contraseña única en `ADMIN_PASSWORD`, comparada con hash SHA-256 + `timingSafeEqual` (no `===`, y no se comparan los buffers de la contraseña directamente para no filtrar su longitud por el `throw` de `timingSafeEqual` ante tamaños distintos). Al validar, se emite una cookie httpOnly `admin_session` firmada con HMAC-SHA256 derivado de `ADMIN_PASSWORD` (no hace falta un secreto nuevo, y rotar la contraseña invalida todas las sesiones firmadas con la anterior), expira a las 8 horas. Nunca se usa Auth.js aquí a propósito: es una herramienta de una sola persona y mezclarla con el sistema de cuentas de los usuarios habría acoplado dos cosas sin relación.

**Si `ADMIN_PASSWORD` no está definida, `/admin` completo no existe** — 404, no un formulario de login que anuncie la herramienta. Mismo trato para cualquier request sin cookie válida bajo `/admin/*` o `/api/admin/*`: 404, nunca 401.

**El chequeo de acceso vive en tres capas, no una sola, y las tres son necesarias:**
1. `proxy.ts` (`guardAdmin`) — la que de verdad determina el status code HTTP. Este proyecto tiene un `app/loading.tsx` raíz, lo que hace que **toda** ruta streamee un shell con `200` antes de que un `notFound()` más adentro del árbol de React pueda resolverse — confirmado probando `/resultado/<id-inexistente>`, que ya tenía este mismo comportamiento antes de que existiera el panel de admin. Un 404 real solo se puede garantizar deteniendo la petición antes de que empiece el streaming, así que `proxy.ts` valida la cookie con Web Crypto (`crypto.subtle`, no `node:crypto` — el runtime de Proxy/Middleware puede ser Edge) y devuelve `404` directo si falta o es inválida, sin tocar React.
2. `app/admin/layout.tsx` (gate de `ADMIN_PASSWORD`) y `app/admin/(protected)/layout.tsx` (gate de sesión) — capa de defensa adicional a nivel de React, en caso de que algo bypasee el proxy.
3. **Cada página protegida repite el mismo chequeo como su primera línea**, antes de cualquier `await` a la DB (`dashboard/page.tsx`, `usuarios/page.tsx`, `usuarios/[userId]/page.tsx`). Esto no es redundancia decorativa: **hallazgo real de esta ronda** — Next.js puede empezar a renderizar una página y su layout en paralelo (fetching de datos paralelo entre segmentos), así que un `notFound()` solo en el layout no impedía que las queries de la página corrieran igual; su resultado (compras, ingresos, correos de usuarios) terminaba serializado en el payload RSC de la respuesta HTTP a una petición sin cookie, aunque la UI visible mostrara el 404. Confirmado con curl inspeccionando los bytes crudos de la respuesta antes y después del fix. El chequeo temprano en cada página es lo que de verdad cierra esa fuga.

Cada ruta de API bajo `/api/admin/*` llama a `requireAdmin()` (`lib/admin-auth.ts`) como primera línea del handler — ahí no hay problema de streaming porque un Route Handler no pasa por React, así que un `return` con status 404 antes de cualquier query ya es correcto por sí solo.

**Login** es un Server Action normal en `app/admin/page.tsx` (mismo patrón que `/entrar`), con rate limiting reutilizando `lib/rate-limit.ts` (**5 intentos por IP / 15 min**). No hay `POST /api/admin/login` — no hacía falta una ruta de API separada para esto.

**Métricas** (`lib/admin-metrics.ts`) — todo calculado con queries a `Job`/`User`/`CreditTransaction`, sin tablas nuevas. El costo de API estimado usa las constantes de `API_COST_MXN` en `lib/pricing.ts` (mismos números que la tabla "Costo por operación" de este archivo — actualizar ambos lados si cambian). El ingreso y el paquete de cada compra se infieren emparejando `CreditTransaction.delta` contra `PACKAGES` en `lib/pricing.ts` (los créditos por paquete son únicos, así que el match es exacto) — no se duplica el precio en ningún lado nuevo. La serie de 30 días usa dos queries agregadas con `date_trunc` en SQL crudo (`prisma.$queryRaw`) en vez de 30 iteraciones, porque el cliente tipado de Prisma no expresa group-by-por-día.

**Ajuste manual de créditos** (`lib/credits.ts` → `adjustCreditsByAdmin`): agregó el reason `ADMIN_ADJUSTMENT` al enum `CreditReason` y una columna `CreditTransaction.note` (texto libre, obligatorio solo para este reason) — es la única mutación de todo el panel, y como el resto de `lib/credits.ts`, nunca es un `update` suelto: un `updateMany` condicional (`credits >= -delta`, válido tanto para sumar como para restar) dentro de la misma transacción que crea el `CreditTransaction` impide dejar el saldo negativo y garantiza que todo ajuste deja rastro. El formulario (`AdjustCreditsForm.tsx`, client component) pide confirmación explícita (`window.confirm` con el motivo visible) antes de enviar.

**Privacidad, incluso del lado del admin:** las páginas de usuario y las queries de jobs nunca seleccionan `inputUrl`/`outputUrl`/`restoredUrl` — se puede ver que un job existe, su tipo, tier, estado y error, no el contenido de la foto.

`app/robots.ts` ya excluye `/admin` (host de producción); no se agregó a `sitemap.ts` porque nunca estuvo ahí (allowlist explícita).

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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # sin usar hoy — el checkout es 100% hospedado por Stripe (redirect a session.url), no hay Stripe.js en el cliente. Se deja por si algún día se necesita Elements embebido
STRIPE_WEBHOOK_SECRET=      # de `stripe listen --forward-to localhost:3000/api/webhooks/stripe` en dev; el de producción se genera al crear el endpoint en el dashboard de Stripe
MERCADOPAGO_ACCESS_TOKEN=

CRON_SECRET=               # protege /api/cron/cleanup — Vercel Cron manda `Authorization: Bearer $CRON_SECRET` automáticamente cuando la env var existe en el proyecto
NEXT_PUBLIC_FB_PIXEL_ID=
META_CAPI_TOKEN=            # token de acceso de la app de Meta Conversions API — sin esto, el webhook de Stripe sigue acreditando créditos normal, solo se omite (log + return) el evento Purchase server-side
NEXT_PUBLIC_BASE_URL=       # usada para construir el webhookUrl que se le pasa a fal.queue.submit, y success_url/cancel_url/event_source_url de Stripe/Meta CAPI

FREE_TIER_DAILY_CAP=200     # tope de previews gratis por día calendario UTC; default 200 si se omite. Ver sección "Seguridad"
FREE_TIER_ENABLED=true      # kill switch de emergencia — cualquier valor distinto a 'false' cuenta como activado

ADMIN_PASSWORD=             # contraseña de /admin — auth propia, no Auth.js (ver sección "Panel de administración"). Sin esto, /admin y /api/admin/* no existen (404). Generar un valor distinto para producción, nunca reusar el de dev.
```

Hoy vive en `.env` (no `.env.local`) en este entorno de desarrollo, con credenciales reales para todo (Neon, Vercel Blob, fal, Google OAuth, Resend) — nada es un placeholder que impida arrancar. Lo que sí es de dev-solamente, y **no debe copiarse tal cual a producción**, son los cuatro valores listados en la tabla de la sección "Despliegue a producción" más abajo (`NEXT_PUBLIC_BASE_URL`, `AUTH_URL`, `AUTH_SECRET`, `CRON_SECRET`) — los tres primeros porque apuntan al túnel de ngrok o son secretos de un solo entorno, `CRON_SECRET` porque el de este `.env` se generó únicamente para probar el cron en local.

**Gotcha de dev con `AUTH_URL` en https (ngrok):** el navegador solo guarda cookies con prefijo `__Secure-` en orígenes https. Si `AUTH_URL` apunta al túnel de ngrok (https) pero se navega directo a `http://localhost:3000`, el login se ve roto — la cookie de sesión nunca se guarda. Para probar login en local, hay que navegar a través de la URL de ngrok, no de `localhost` directo.

**`callbacks.signIn` corre ANTES de que exista la fila de `User`, no después.** Para un usuario nuevo el orden real es: perfil de OAuth → `callbacks.signIn` → (si devuelve `true`) `adapter.createUser` + `createSession` → `events.signIn`. Cualquier código en `callbacks.signIn` que asuma que `user.id` ya tiene fila en la DB (un `update`, o `mergeAnonymousUser`) falla con "No record was found for an update" en el primer login de cada cuenta nueva, y Auth.js traduce esa excepción en un `AccessDenied` genérico — no hay traza clara hacia la causa real. La regla: todo lo que necesite que el usuario ya exista en la DB va en `events.signIn` (recibe `user`, `account`, `profile` e `isNewUser`, y sí corre después de crear usuario y sesión), nunca en el callback. Lo que sí puede ir en el callback es lógica que no toca la DB por ese id — como decidir si permitir o negar el login (por ejemplo, el guard de `allowDangerousEmailAccountLinking` de abajo, que solo lee). Ver `lib/auth.ts`.

**Un solo usuario por correo, sin importar el método (Google ↔ magic link).** `Google({ allowDangerousEmailAccountLinking: true })` deja que un login de Google se enlace a una cuenta existente con el mismo correo (creada antes por magic link) en vez de fallar con `OAuthAccountNotLinked`. Es seguro **solo en este provider y solo porque las dos partes ya probaron ser dueñas del correo por caminos independientes**: Google, cuando `profile.email_verified === true`; el magic link, por definición, al haberlo clickeado. `callbacks.signIn` bloquea explícitamente el caso peligroso (Google con `email_verified: false` intentando enlazar a una cuenta que ya existe) devolviendo `false` — un correo no verificado no prueba nada. **Si se agrega otro provider OAuth, no copiar la bandera sin repetir este mismo análisis para ese provider.** Al enlazar, `events.signIn` rellena `name`/`image`/`emailVerified` **solo si están en null** (nunca pisa un valor que el usuario ya tenía) — probado contra la DB real en ambos órdenes (magic link→Google y Google→magic link).

**`events.signOut` limpia la cookie `uid`, y es obligatorio.** `setAnonUidCookie()` reescribe `uid` al id del usuario autenticado en cada login (para que un login posterior en el mismo dispositivo se fusione en vez de crear otro anónimo). Sin limpiarla al salir, `uid` se queda apuntando a una cuenta real ya sin sesión — `getUserId()` la toma como identidad anónima y expone el saldo/créditos de esa cuenta sin necesidad de volver a autenticarse. Se detectó y confirmó este bug contra la DB real antes de corregirlo.

**`proxy.ts` valida el *valor* de la cookie de sesión, no solo su presencia.** La respuesta de `/api/auth/signout` limpia `...session-token` con `Set-Cookie: ...=;` **sin `Expires`/`Max-Age`** — el navegador la conserva como cookie de sesión con valor vacío hasta que se cierra, no la borra. Un `request.cookies.has(name)` la cuenta como "hay sesión" igual, así que después de salir nunca se emitía un `uid` nuevo y `getUserId()` caía al fallback — que además era un literal `'anonymous'` compartido entre cualquiera en ese estado (ya corregido: el fallback ahora es un `crypto.randomUUID()` por request, nunca un id fijo). La regla: cualquier chequeo de "¿hay sesión?" en código que corre antes de `auth()` (o sin DB a mano, como en `proxy.ts`) debe revisar `.value`, no solo que la cookie exista.

**`opengraph-image.tsx` y `twitter-image.tsx` no se pueden importar entre sí.** Son archivos de convención especial de Next.js (cada uno es su propia route); intentar `export { default } from './opengraph-image'` desde `twitter-image.tsx` compila en `next build` pero **rompe en `next dev`** con `Module not found` — Turbopack no resuelve ese import cruzado entre dos rutas especiales de forma confiable, y el fallo es silencioso desde la perspectiva del navegador: Next.js sirve una imagen de respaldo genérica (el ícono del sitio + el nombre) en vez de mostrar un error. La lógica de composición compartida vive en `lib/og-image.tsx` (módulo normal), y cada archivo de convención declara sus propios `alt`/`size`/`contentType`/`runtime` literales e importa solo la función de render. Si alguna vez aparece un `app/opengraph-image.png` suelto junto al `.tsx` (puede pasar en dev tras una corrida con errores), bórralo — es una imagen cacheada vieja que Next.js prioriza por encima del generador.

### Configuración externa (auth)

Ya configurado para dev — credenciales reales en `.env`. Lo que falta es agregar producción a lo mismo, no crear nada desde cero:

1. **Google Cloud Console** → en las mismas credenciales OAuth 2.0 ya creadas (tipo "Web application"), agregar a **Authorized redirect URIs** (además de la del túnel de ngrok, que se queda para seguir probando en local):
   - `https://www.revivelos.com/api/auth/callback/google`
   - Si el túnel de ngrok cambia de subdominio (pasa en el plan gratuito cada vez que se reinicia), hay que volver a agregar la nueva redirect URI de dev aquí — si no, Google responde `redirect_uri_mismatch`. Esto no afecta a producción una vez agregada.
2. **Resend**: confirmar que el dominio de `EMAIL_FROM` (`contacto.revivelos.com`) esté verificado en el dashboard de Resend (registros DNS SPF/DKIM) — sin eso, Resend rechaza el envío o lo manda a spam agresivamente. La API key (`AUTH_RESEND_KEY`) es la misma para dev y producción, no hace falta una nueva.

---

## Despliegue a producción

Preparación de código hecha en esta ronda — build y lint limpios, `npm run build` corre `prisma generate && prisma migrate deploy && next build` (antes solo `generate`, así que las migraciones ya no dependen de correrlas a mano). **Stripe (tarjetas) ya está integrado y funcionando** en dev contra el sandbox — ver la tabla de estado. **Mercado Pago (OXXO/SPEI) queda fuera a propósito**, para una siguiente iteración.

### Variables de entorno — qué cambia en producción vs. dev

| Variable | Dev (hoy) | Producción | Por qué cambia |
|---|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | túnel de ngrok | `https://www.revivelos.com` | Se usa para construir el `webhookUrl` que recibe fal — si apunta al túnel, los webhooks de producción nunca llegan |
| `AUTH_URL` | túnel de ngrok | `https://www.revivelos.com` | Determina el dominio de las cookies de sesión y las redirect URIs válidas de OAuth |
| `AUTH_SECRET` | valor de dev | **uno nuevo**, generado aparte | Nunca reutilizar el secreto de firma de cookies entre entornos — si dev y producción comparten `AUTH_SECRET`, una sesión firmada en un entorno es válida en el otro. Generar con `npx auth secret` u `openssl rand -base64 32` |
| `CRON_SECRET` | valor de prueba local | **uno nuevo** | El de este repo se generó solo para los tests en vivo de esta ronda — es de un solo uso, no debe llegar a producción |
| `DATABASE_URL` / `DIRECT_URL` | Neon (este proyecto) | decisión pendiente | Confirmar si esta misma base de Neon sirve como base de producción o si conviene provisionar un proyecto de Neon aparte — no es algo que se pueda decidir por código |
| `BLOB_READ_WRITE_TOKEN` | este Blob store | decisión pendiente | Mismo caso: confirmar si el store actual pasa a producción o si conviene uno nuevo |
| `FAL_KEY` | esta key | probablemente la misma | fal no distingue entornos por key; usar la misma es razonable a menos que se quiera separar el gasto de dev del de producción en el dashboard de fal |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | reales, funcionando | las mismas | No son específicas de dominio — solo hace falta agregar la redirect URI de producción en Google Cloud Console (ver arriba), no generar credenciales nuevas |
| `AUTH_RESEND_KEY` / `EMAIL_FROM` | reales, funcionando | las mismas | Confirmar que el dominio de `EMAIL_FROM` esté verificado en Resend antes del primer envío real |
| `FREE_TIER_DAILY_CAP` | `200` | recomendado: **empezar más bajo** (ver abajo) | El valor de hoy es el default conservador de la sección "Seguridad" — vale la pena bajarlo los primeros días de campaña real |
| `FREE_TIER_ENABLED` | `true` | `true` | Sin cambios — es el kill switch de emergencia, no un valor de configuración por entorno |
| `STRIPE_SECRET_KEY` | key de sandbox | **key de producción (`sk_live_...`)** | La de dev solo procesa tarjetas de prueba — cobrar de verdad exige la key live de la cuenta de Stripe real |
| `STRIPE_WEBHOOK_SECRET` | el que imprime `stripe listen` en dev | **el del endpoint configurado en el dashboard de Stripe** apuntando a `https://www.revivelos.com/api/webhooks/stripe` | Cada endpoint (dev vs. producción) tiene su propio secreto de firma — no son intercambiables |
| `MERCADOPAGO_*` | sin usar | **no configurar todavía** | Mercado Pago queda fuera de este despliegue a propósito |
| `META_CAPI_TOKEN` | sin definir | opcional, igual que `NEXT_PUBLIC_FB_PIXEL_ID` | Sin ella el webhook de Stripe sigue acreditando créditos normal, solo se omite el evento `Purchase` server-side (log + return, ver `lib/meta-capi.ts`) |
| `NEXT_PUBLIC_FB_PIXEL_ID` | sin definir | opcional | `MetaPixel.tsx` no renderiza nada si falta — definirla solo cuando se quiera que el Pixel esté activo desde el día 1 |

**Free tier el día del lanzamiento:** el tope hoy vive en `200`/día (el default conservador documentado en "Seguridad", pensado para el peor caso — 200 × $3.33 MXN con Nano Banana Pro si todo se sirviera con el modelo caro, aunque el free tier usa el barato). Con tráfico real de Meta ads y sin datos históricos de conversión todavía, recomiendo arrancar más bajo — **50 o 100** — los primeros 3-5 días, y subirlo una vez que se vea el costo real por foto subida (la métrica que ya está marcada como "a vigilar" en la sección de economía del producto). Subir el número no requiere deploy, solo cambiar la env var en Vercel.

### Checklist de despliegue — pasos manuales (no los puede hacer un agente)

1. **Decidir la base de datos y el Blob store de producción** — reutilizar los de dev, o provisionar unos nuevos en Vercel/Neon. Si son nuevos, correr `prisma migrate deploy` una vez contra ellos antes del primer deploy (o dejar que el build lo haga automáticamente, ya que `npm run build` lo incluye).
2. **En Vercel → Settings → Domains**: confirmar `www.revivelos.com` como dominio de producción primario, y que `revivelos.com` (apex) siga con el redirect 308 existente hacia `www`.
3. **En Vercel → Settings → Environment Variables** (scope Production): cargar la tabla de arriba completa. Generar `AUTH_SECRET` y `CRON_SECRET` nuevos — no copiar los de `.env`.
4. **Google Cloud Console**: agregar `https://www.revivelos.com/api/auth/callback/google` a las redirect URIs autorizadas (ver sección de arriba).
5. **Resend**: confirmar que el dominio de `EMAIL_FROM` esté verificado.
6. **Vercel Cron**: se activa solo con `vercel.json` + `CRON_SECRET` seteado — nada manual aquí, pero vale la pena revisar en el dashboard de Vercel que el cron aparezca programado después del primer deploy.
7. **Primer deploy**: confirmar en los logs de build que `prisma migrate deploy` corrió sin errores antes de `next build`.
8. **Después del primer deploy**: probar el flujo completo (`/crear` → restauración gratis → `/resultado`) contra `https://www.revivelos.com` real, no contra ngrok. Confirmar que el login con Google funciona con la redirect URI nueva.
9. **Decidir cuándo activar `NEXT_PUBLIC_FB_PIXEL_ID`** (y `META_CAPI_TOKEN`) — puede quedar sin definir hasta que se lance la primera campaña de Meta ads.
10. **Stripe en producción**: cambiar a la key live, crear el endpoint de webhook en el dashboard de Stripe apuntando a `https://www.revivelos.com/api/webhooks/stripe` con el evento `checkout.session.completed`, y cargar el `STRIPE_WEBHOOK_SECRET` que genera ese endpoint (no el de `stripe listen`). Probar una compra real de punta a punta antes de anunciar precios. Mercado Pago queda para después — no bloquea este despliegue.

---

## Cómo trabajar en este repo

Al terminar un cambio, **actualiza la tabla "Estado real vs. pendiente"** de este archivo. Es lo primero que lee el siguiente agente y lo que más rápido se desactualiza.