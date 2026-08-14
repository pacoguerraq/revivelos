import { type NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/cookies'
import { ensureUser, InsufficientCreditsError } from '@/lib/credits'
import { createJobAndCharge, updateJobStatus } from '@/lib/jobs'
import { storage } from '@/lib/storage'
import type { JobType } from '@/lib/types'

const MOCK_DELAY_PROCESSING_MS = 2_000
const MOCK_DELAY_COMPLETE_MS = 11_000

function simulateMockProcessing(jobId: string, inputUrl: string) {
  // pending → processing
  setTimeout(() => {
    updateJobStatus(jobId, { status: 'PROCESSING' }).catch(() => {})
  }, MOCK_DELAY_PROCESSING_MS)

  // processing → completed
  // TODO: integrar fal.ai — reemplazar este bloque con webhook de fal.ai
  setTimeout(() => {
    updateJobStatus(jobId, {
      status: 'COMPLETED',
      outputUrl: inputUrl, // mock: misma imagen; el cliente aplica filtros CSS
    }).catch(() => {})
  }, MOCK_DELAY_COMPLETE_MS)
}

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

  if (!['restore', 'animate'].includes(type)) {
    return NextResponse.json({ error: 'Tipo de acción inválido' }, { status: 400 })
  }

  if (!photo || photo.size === 0) {
    return NextResponse.json({ error: 'No se recibió ninguna foto' }, { status: 400 })
  }

  await ensureUser(userId)

  const imageBuffer = new Uint8Array(await photo.arrayBuffer())
  const blobUrl = await storage.put(
    `jobs/${userId}/${crypto.randomUUID()}`,
    imageBuffer,
    photo.type || 'image/jpeg',
  )

  try {
    const job = await createJobAndCharge({ userId, type, inputUrl: blobUrl })
    simulateMockProcessing(job.id, job.inputUrl)
    return NextResponse.json({ jobId: job.id }, { status: 201 })
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
}
