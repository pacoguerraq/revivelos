import { fal } from '@fal-ai/client'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} no está definida. Agrégala a .env.local antes de arrancar.`)
  }
  return value
}

if (!process.env.FAL_KEY) {
  throw new Error('FAL_KEY no está definida. Agrégala a .env.local antes de arrancar.')
}
fal.config({ credentials: process.env.FAL_KEY })

const MODEL_RESTORE_PAID = requireEnv('FAL_MODEL_RESTORE_PAID')
const MODEL_RESTORE_FREE = requireEnv('FAL_MODEL_RESTORE_FREE')
const MODEL_ANIMATE = requireEnv('FAL_MODEL_ANIMATE')

// Prompts validados a mano contra 5 fotos reales — ver AGENTS.md.
// No cambiar sin volver a validar contra el mismo set.
export const RESTORE_PROMPT_PAID = `Restore and colorize this damaged photograph.

Remove cracks, tears, scratches, stains, fold lines and missing emulsion ONLY where you can reconstruct the area with high confidence from the clearly visible surrounding content. If a damaged area cannot be reconstructed with confidence, leave it softer or less defined rather than guessing — never invent plausible-looking content to fill a gap.

Slightly improve overall sharpness and clarity, as if the photo had been taken with a better camera at the time — reduce blur and softness moderately. Do not add fine detail, texture or sharpness to faces beyond what is visible in the source; skin and facial features should stay soft and natural, never enhanced or over-defined.

Add realistic color with a natural, moderately saturated era-appropriate palette — more lifelike than a muted or faded look, but still soft and believable: natural skin tones with no rosy or oversaturated cheeks, believable ambient lighting, clothing colors consistent with the period. The result should look like a well-preserved film photograph from the era with natural color, not a modern digital, HDR, or vividly saturated image.

ABSOLUTE constraints — these override every instruction above if they ever conflict:
- Never add, invent, remove, replace or rearrange any object, person, animal, plant, garment, texture, or background element that is not unambiguously visible in the original. This includes trees, furniture, patterns, jewelry, or any other detail — if it is not clearly there, it does not go in the output.
- Do not invent or complete an entire missing scene, background or setting. If a large area is damaged or unclear, keep it desaturated, soft, or low-detail rather than reconstructing it as a full plausible scene.
- Where damage obscures a small detail, only reconstruct it if the remaining visible pixels make the answer unambiguous. If there is any doubt, leave it unresolved rather than guessing.
- The people must remain recognizable as the exact same individuals: preserve facial features, expressions, proportions, body position and hairstyle exactly as shown — no reinterpretation.
- Do not beautify, do not smooth or add texture to skin beyond the source, do not over-sharpen faces, do not increase contrast or saturation beyond a natural, moderate level.
- Preserve the original framing, composition and camera angle exactly — do not extend, crop, or reimagine the scene beyond the original photo's borders.
- When in doubt between "safe and slightly imperfect" and "polished but invented," always choose safe and slightly imperfect.`

export const RESTORE_PROMPT_FREE = `Restore and colorize this damaged photograph.

Remove all cracks, tears, scratches, stains, fold lines and missing emulsion, reconstructing damaged areas strictly from the surrounding content.

Add full, realistic color to the entire image — skin, clothing, background and every object. Do not leave any area grey, washed out or partially colorized. Use natural skin tones with no rosy or oversaturated cheeks, and believable ambient lighting. The result should look like a color film photograph, not a hand-tinted black and white image.

Strict constraints:
- Do not add, remove, replace or rearrange any object, flower, garment or background element that is not visible in the original.
- Where damage obscures a detail, infer it conservatively from what remains. Never invent a more interesting version.
- The people must remain recognizable as the exact same individuals: preserve facial features, expressions, proportions and hairstyle precisely.
- Do not beautify, do not smooth skin, do not change anyone's apparent age.
- Preserve the original framing and composition exactly.`

export const ANIMATE_PROMPT = `Each person in the photograph comes to life with subtle, natural movement. They blink, breathe gently, and shift their weight very slightly. One or more of them may slowly turn their head slightly toward the camera and give a soft, warm smile.

If there is more than one person, each moves independently and at their own timing — never in unison. Stagger the blinks and micro-movements so they feel like separate living people, not a synchronized animation. Vary the intensity: some may move slightly more than others.

Movement is slow, gentle and minimal. The camera is completely static.

Photorealistic. Preserve the exact facial features and identity of every person. No camera movement, no zoom, no talking, no dramatic gestures, no change in who anyone is.`

function webhookUrl(): string {
  return new URL('/api/webhooks/falai', requireEnv('NEXT_PUBLIC_BASE_URL')).toString()
}

export async function uploadToFal(data: Uint8Array, contentType: string): Promise<string> {
  const file = new Blob([Buffer.from(data)], { type: contentType })
  return fal.storage.upload(file)
}

// TODO: verificar el nombre exacto de los parámetros de input contra la
// página de API de cada modelo antes de ir a producción. Los modelos de
// edición de imagen (nano-banana*) suelen recibir `image_urls: string[]`;
// los de image-to-video reciben `image_url` en singular. Si fal devuelve
// 422, el mensaje de validación indica el campo esperado.
export async function submitRestore(imageUrl: string, tier: 'FREE' | 'PAID'): Promise<string> {
  const model = tier === 'PAID' ? MODEL_RESTORE_PAID : MODEL_RESTORE_FREE
  const prompt = tier === 'PAID' ? RESTORE_PROMPT_PAID : RESTORE_PROMPT_FREE
  const { request_id } = await fal.queue.submit(model, {
    input: { prompt, image_urls: [imageUrl] },
    webhookUrl: webhookUrl(),
  })
  return request_id
}

export async function submitAnimate(imageUrl: string): Promise<string> {
  const { request_id } = await fal.queue.submit(MODEL_ANIMATE, {
    input: {
      prompt: ANIMATE_PROMPT,
      image_url: imageUrl,
      duration: '5',
      generate_audio: false,
    },
    webhookUrl: webhookUrl(),
  })
  return request_id
}

export class UnexpectedPayloadError extends Error { }

// Payload de los modelos de edición de imagen (nano-banana*): { images: [{ url }] }
export function extractRestoreImageUrl(payload: unknown): string {
  const url = (payload as { images?: Array<{ url?: unknown }> } | undefined)?.images?.[0]?.url
  if (typeof url !== 'string') {
    throw new UnexpectedPayloadError('fal devolvió un formato de imagen inesperado.')
  }
  return url
}

// Payload de kling image-to-video: { video: { url } }
export function extractVideoUrl(payload: unknown): string {
  const url = (payload as { video?: { url?: unknown } } | undefined)?.video?.url
  if (typeof url !== 'string') {
    throw new UnexpectedPayloadError('fal devolvió un formato de video inesperado.')
  }
  return url
}
