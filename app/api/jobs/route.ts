import { type NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/cookies'
import { ensureUser, InsufficientCreditsError } from '@/lib/credits'
import { createJobAndCharge, failJobAndRefund, markSubmitted } from '@/lib/jobs'
import { storage } from '@/lib/storage'
import { submitRestore, uploadToFal } from '@/lib/fal'
import type { JobType } from '@/lib/types'

export async function POST(request: NextRequest) {
  const userId = await getUserId()

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

  await ensureUser(userId)

  const imageBuffer = new Uint8Array(await photo.arrayBuffer())
  const photoContentType = photo.type || 'image/jpeg'
  const extension = photoContentType.split('/')[1]?.split('+')[0] || 'jpg'
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
