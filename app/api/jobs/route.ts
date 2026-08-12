import { type NextRequest, NextResponse } from 'next/server'
import { jobsStore, imagesStore, creditsStore } from '@/lib/stores'
import { getUserId } from '@/lib/cookies'
import { RESTORE_COST, ANIMATE_COST } from '@/lib/pricing'
import type { Job, JobType } from '@/lib/types'

const MOCK_DELAY_PROCESSING_MS = 2_000
const MOCK_DELAY_COMPLETE_MS = 11_000

function simulateMockProcessing(jobId: string) {
  // pending → processing
  setTimeout(() => {
    jobsStore.update(jobId, { status: 'processing' })
  }, MOCK_DELAY_PROCESSING_MS)

  // processing → completed
  // TODO: integrar fal.ai — reemplazar este bloque con webhook de fal.ai
  setTimeout(() => {
    const job = jobsStore.get(jobId)
    if (!job) return
    jobsStore.update(jobId, {
      status: 'completed',
      outputUrl: job.inputUrl, // mock: misma imagen; el cliente aplica filtros CSS
    })
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

  // Verificar créditos
  const balance = creditsStore.get(userId)
  const isFreeRestore = type === 'restore' && !balance.freeUsed
  const creditCost = type === 'animate' ? ANIMATE_COST : RESTORE_COST

  if (!isFreeRestore && balance.credits < creditCost) {
    return NextResponse.json(
      { error: 'No tienes suficientes créditos', code: 'INSUFFICIENT_CREDITS' },
      { status: 402 },
    )
  }

  const jobId = crypto.randomUUID()
  const imageBuffer = new Uint8Array(await photo.arrayBuffer())

  imagesStore.set(jobId, {
    buffer: imageBuffer,
    mimeType: photo.type || 'image/jpeg',
    originalName: photo.name,
  })

  if (isFreeRestore) {
    creditsStore.useFree(userId)
  } else {
    creditsStore.deduct(userId, creditCost)
  }

  const now = new Date().toISOString()
  const job: Job = {
    id: jobId,
    status: 'pending',
    type,
    inputUrl: `/api/image/${jobId}`,
    outputUrl: null,
    watermarked: isFreeRestore,
    error: null,
    createdAt: now,
    updatedAt: now,
    userId,
  }

  jobsStore.set(jobId, job)
  simulateMockProcessing(jobId)

  return NextResponse.json({ jobId }, { status: 201 })
}
