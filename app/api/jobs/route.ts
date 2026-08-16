import { type NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/cookies'
import { ensureUser, FreeTierUnavailableError, InsufficientCreditsError } from '@/lib/credits'
import { createJobAndCharge, failJobAndRefund, markSubmitted } from '@/lib/jobs'
import { storage } from '@/lib/storage'
import { submitRestore, uploadToFal } from '@/lib/fal'
import { checkRateLimits, getClientIp, maybeCleanupOldHits, RateLimitError } from '@/lib/rate-limit'
import { isFileValidationError, validateImageFile } from '@/lib/file-validation'
import type { JobType } from '@/lib/types'

const HOUR_MS = 60 * 60 * 1000

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  const ip = getClientIp(request)

  // Cada foto cuesta dinero real de fal en cuanto se manda (aunque sea free
  // tier). Este es el límite más importante de todo el sitio: sin él, un
  // script que borra su cookie en un loop vacía la cuenta de fal. Por IP
  // porque un uid nuevo es gratis de crear; la IP no.
  try {
    await checkRateLimits([
      { key: `jobs:ip:${ip}`, limit: 5, windowMs: HOUR_MS },
      { key: `jobs:user:${userId}`, limit: 10, windowMs: HOUR_MS },
    ])
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Muchas fotos en poco tiempo. Espera un momento antes de subir otra.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } },
      )
    }
    throw error
  }
  maybeCleanupOldHits(24 * HOUR_MS)

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Se esperaba multipart/form-data' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el formulario' }, { status: 400 })
  }

  const type = formData.get('type') as JobType
  const photo = formData.get('photo') as File | null
  const fingerprint = formData.get('fingerprint')

  if (!['restore', 'animate'].includes(type)) {
    return NextResponse.json({ error: 'Tipo de acción inválido' }, { status: 400 })
  }

  if (!photo || photo.size === 0) {
    return NextResponse.json({ error: 'No se recibió ninguna foto' }, { status: 400 })
  }

  const imageBuffer = new Uint8Array(await photo.arrayBuffer())

  // Nunca confiar en photo.type (lo manda el cliente) ni en la extensión del
  // nombre de archivo — se detecta el formato real por los primeros bytes.
  const validation = validateImageFile(imageBuffer)
  if (isFileValidationError(validation)) {
    return NextResponse.json({ error: validation.message }, { status: 400 })
  }
  const photoContentType = validation.mime

  await ensureUser(userId)

  const extension = photoContentType.split('/')[1]
  const blobUrl = await storage.put(
    `jobs/${userId}/${crypto.randomUUID()}-input.${extension}`,
    imageBuffer,
    photoContentType,
  )

  let job
  try {
    job = await createJobAndCharge({
      userId,
      type,
      inputUrl: blobUrl,
      fingerprint: typeof fingerprint === 'string' && fingerprint ? fingerprint : undefined,
    })
  } catch (error) {
    await storage.delete(blobUrl).catch(() => {})
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: 'No tienes suficientes créditos', code: 'INSUFFICIENT_CREDITS' },
        { status: 402 },
      )
    }
    if (error instanceof FreeTierUnavailableError) {
      return NextResponse.json(
        {
          error: 'Hoy ya alcanzamos el límite de pruebas gratuitas. Vuelve mañana o compra créditos para continuar.',
          code: 'FREE_TIER_UNAVAILABLE',
        },
        { status: 429 },
      )
    }
    throw error
  }

  // El job ya existe y ya se cobró. Si el envío a fal falla, se reembolsa
  // y se devuelve 201 igual: el cliente lo verá FAILED al hacer polling.
  try {
    const falImageUrl = await uploadToFal(imageBuffer, photoContentType)
    const tier = job.tier as 'FREE' | 'PAID'
    const requestId = await submitRestore(falImageUrl, tier)
    await markSubmitted(job.id, requestId)
  } catch (error) {
    console.error('No se pudo enviar el job a fal', error)
    await failJobAndRefund(job.id, 'No se pudo iniciar el procesamiento')
  }

  return NextResponse.json({ jobId: job.id }, { status: 201 })
}
