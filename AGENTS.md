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
| Modelos y prompts de IA | **Validados a mano en el sandbox de fal** — ver sección siguiente. Sin integrar en código. |
| Procesamiento | Mock — `setTimeout` 2s→11s, no llama a ninguna IA |
| Créditos | Mock — Maps en memoria, se resetean al reiniciar |
| Imágenes de resultado | Mock — devuelve la misma imagen de entrada |
| Pago / Stripe | Sin implementar — `POST /api/credits` devuelve 503 |
| Imágenes de /public/ejemplos/ | Sin agregar — sliders muestran ImageFallback con la ruta |
| Base de datos | Sin implementar — todo vive en Maps |

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

### Fase 1 — Infraestructura real ← SIGUIENTE
- **Prisma + Postgres** (Neon o Supabase): modelos `User`, `Job`, `CreditTransaction`. Migrar `stores.ts` → Prisma client. Deducción de créditos en transacción atómica: verificar saldo *dentro* de la transacción, nunca leer-y-luego-escribir.
- **`lib/storage.ts`**: abstracción local (disco) / producción (Cloudflare R2 — sin costo de egress, relevante con video). Upload en `POST /api/jobs`, download en `/api/image/[jobId]`.
- **Imágenes de ejemplo reales**: agregar a `/public/ejemplos/` — `hero-antes.jpg`, `hero-despues.jpg`, `1-antes.jpg`, `1-despues.jpg`, `2-antes.jpg`, `2-despues.jpg`, `3-antes.jpg`, `3-despues.jpg`.

**Por qué es lo siguiente:** los Maps en memoria no sobreviven en Vercel. Cada invocación serverless puede caer en otro proceso y los `setTimeout` mueren al terminar la función. Hoy un usuario puede pagar y perder su saldo. El deploy actual no debe compartirse con nadie.

### Fase 2 — IA real
- Cliente de fal en `lib/fal.ts` con los IDs y prompts de arriba.
- **Cola con webhooks, NO polling síncrono.** Los tiempos medidos lo exigen: restaurar tarda 8-20s y animar 67-142s, muy por encima del timeout de una función serverless.
- Flujo: crear job en DB → enviar a la cola de fal con `webhook_url` → fal pega en `app/api/webhooks/falai/route.ts` al terminar → actualizar job. El cliente consulta estado contra nuestra propia DB, no contra fal.
- **Las URLs que devuelve fal son temporales**: copiar el archivo a nuestro storage antes de responder.
- Punto de integración actual: `simulateMockProcessing()` en `app/api/jobs/route.ts`.
- Encadenamiento del video: restaurar primero, guardar, y usar esa salida como entrada de Kling.
- Considerar recortar el clip a ~3s en loop: la degradación aparece al final y un loop corto se siente más natural que un corte seco.

### Fase 3 — Monetización y growth
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

Una sola restauración gratis por usuario (`freeUsed`), en baja resolución, con marca de agua, y limitada por fingerprint de dispositivo además de la cookie. El video **nunca** gratis completo — máximo un preview corto con marca de agua.

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
# .env.local
DATABASE_URL=              # Postgres (Neon/Supabase)

FAL_KEY=                   # fal.ai API key
FAL_MODEL_RESTORE_PAID=fal-ai/nano-banana-pro/edit
FAL_MODEL_RESTORE_FREE=fal-ai/nano-banana/edit
FAL_MODEL_ANIMATE=fal-ai/kling-video/v2.5-turbo/pro/image-to-video
FAL_WEBHOOK_SECRET=        # validar los webhooks entrantes de fal

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
MERCADOPAGO_ACCESS_TOKEN=

R2_ACCOUNT_ID=             # Cloudflare R2
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

CRON_SECRET=               # protege /api/cron/cleanup
NEXT_PUBLIC_FB_PIXEL_ID=
NEXT_PUBLIC_BASE_URL=
```

Hoy no existe `.env.local` en el repo. El proyecto corre sin variables porque todo es mock.

---

## Cómo trabajar en este repo

Al terminar un cambio, **actualiza la tabla "Estado real vs. pendiente"** de este archivo. Es lo primero que lee el siguiente agente y lo que más rápido se desactualiza.