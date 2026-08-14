# Revívelos

Restaura, coloriza y anima fotos antiguas de familia con IA.

Aplicación web B2C para el mercado mexicano. El usuario sube una foto vieja o dañada, obtiene una restauración a color, y opcionalmente un video corto de 5 segundos donde las personas de la foto parpadean, respiran y sonríen. Se paga con créditos de compra única — sin suscripciones y sin registro antes de ver el resultado.

> **Estado:** en desarrollo. Los modelos y prompts de IA están validados pero aún no integrados; el procesamiento actual es un mock. Ver `AGENTS.md` para el detalle completo.

---

## Stack

- **Next.js 16.3** (App Router) · React 19 · TypeScript estricto
- **Tailwind CSS v4** — sin `tailwind.config.ts`, todo en `@theme` dentro de `globals.css`
- Sin librerías de UI, estado ni animación. Componentes propios.
- Deploy en Vercel

## Arranque

```bash
nvm use 22        # Node ≥20 obligatorio
npm install
npm run dev       # http://localhost:3000
```

No hace falta configurar variables de entorno todavía: el procesamiento, los créditos y el almacenamiento corren como mock en memoria.

```bash
npm run build
npm run lint
```

---

## Estructura

```
proxy.ts              Cookie anónima `uid` (httpOnly) — nota: en Next.js 16
                      el middleware se llama proxy.ts
app/
  page.tsx            Landing
  crear/              Subida de foto y selección de acción
  procesando/[id]/    Pantalla de espera con progreso
  resultado/[id]/     Resultado con slider antes/después
  api/                jobs, image, credits
components/
  landing/  ui/  layout/  icons/
lib/
  pricing.ts          Fuente de verdad de créditos y paquetes
  ejemplos.ts         Rutas de las imágenes de ejemplo
  types.ts  stores.ts  cookies.ts
```

**Fuentes de verdad:** los costos en créditos y los precios salen siempre de `lib/pricing.ts`, y las rutas de imágenes de ejemplo de `lib/ejemplos.ts`. No hardcodear ninguno de los dos.

---

## Cómo funciona

1. El usuario sube una foto en `/crear`. No hay registro; la identidad es una cookie anónima.
2. Elige **restaurar y colorear** (1 crédito, la primera vez gratis) o **animar en video** (3 créditos).
3. Se crea un job y el usuario espera en `/procesando/[jobId]`.
4. El resultado aparece en `/resultado/[jobId]` con un slider de comparación. La versión gratuita lleva marca de agua y baja resolución.

La restauración usa Nano Banana (Pro para resultados pagados, la versión estándar para la vista previa gratuita) y la animación usa Kling 2.5 Turbo Pro, todo a través de **fal.ai**. Los IDs de modelo y los prompts exactos están documentados en `AGENTS.md`.

El video siempre parte de la imagen ya restaurada, nunca de la original dañada.

---

## Paquetes

| Paquete | Créditos | Precio |
|---|---|---|
| Básico | 5 | $99 MXN |
| Familiar | 15 | $249 MXN |
| Álbum completo | 40 | $599 MXN |

1 crédito = 1 restauración · 3 créditos = 1 video de 5 segundos. Los créditos no caducan.

---

## Qué falta

1. **Prisma + Postgres** — hoy todo vive en Maps en memoria, que no sobreviven en Vercel. Es el bloqueador para desplegar.
2. **Integración de fal.ai** con cola y webhooks (el procesamiento tarda de 8s a 142s, más que un timeout serverless).
3. **Stripe + Mercado Pago**, y el Pixel de Meta con Conversions API.
4. Imágenes reales en `/public/ejemplos/` — hoy los sliders muestran un fallback con la ruta faltante.

---

## Antes de contribuir

Lee **`AGENTS.md`**. Contiene el sistema de diseño con valores exactos, las convenciones específicas de Next.js 16 y Tailwind v4 que rompen suposiciones comunes, los prompts de IA validados, la economía del producto, y una lista de reglas que no se rompen — entre ellas: sin testimonios inventados, sin emojis en la UI, sin `localStorage` para identidad o créditos, y sin pedir registro antes de que el usuario vea su resultado.