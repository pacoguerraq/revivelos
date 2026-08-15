import { NextResponse, type NextRequest } from 'next/server'
import type { Job as PrismaJob } from '@prisma/client'
import { prisma } from '@/lib/db'
import { verifyFalWebhook } from '@/lib/fal-verify'
import {
  extractRestoreImageUrl,
  extractVideoUrl,
  submitAnimate,
  UnexpectedPayloadError,
} from '@/lib/fal'
import { storage } from '@/lib/storage'
import { failJobAndRefund } from '@/lib/jobs'
import { applyFreePreviewWatermark } from '@/lib/watermark'

// El video de kling puede tardar en descargarse + sharp puede tomar unos
// segundos — Vercel corta funciones cortas por default.
export const maxDuration = 60

interface FalWebhookBody {
  request_id: string
  status: 'OK' | 'ERROR'
  payload?: unknown
  error?: string
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const requestId = request.headers.get('X-Fal-Webhook-Request-Id')
  const falUserId = request.headers.get('X-Fal-Webhook-User-Id')
  const timestamp = request.headers.get('X-Fal-Webhook-Timestamp')
  const signature = request.headers.get('X-Fal-Webhook-Signature')

  if (!requestId || !falUserId || !timestamp || !signature) {
    return new NextResponse('Faltan headers de firma', { status: 400 })
  }

  const valid = await verifyFalWebhook(rawBody, {
    requestId,
    userId: falUserId,
    timestamp,
    signature,
  })
  if (!valid) {
    return new NextResponse('Firma inválida', { status: 401 })
  }

  let body: FalWebhookBody
  try {
    body = JSON.parse(rawBody)
  } catch {
    return new NextResponse('JSON inválido', { status: 400 })
  }

  const job = await prisma.job.findUnique({ where: { falRequestId: body.request_id } })
  if (!job) {
    // request_id de una etapa ya superada (encadenamiento) o desconocido —
    // no-op idempotente, no hay nada que hacer.
    return NextResponse.json({ ok: true })
  }
  if (job.status === 'COMPLETED' || job.status === 'FAILED') {
    // Entrega duplicada de un evento ya procesado.
    return NextResponse.json({ ok: true })
  }

  if (body.status === 'ERROR') {
    await failJobAndRefund(job.id, body.error ?? 'fal devolvió un error al procesar la foto')
    return NextResponse.json({ ok: true })
  }

  try {
    if (job.type === 'ANIMATE' && job.stage === 'RESTORING') {
      await handleRestoreLegDone(job, body.payload)
    } else {
      await handleFinalSuccess(job, body.payload)
    }
  } catch (error) {
    if (error instanceof UnexpectedPayloadError) {
      await failJobAndRefund(job.id, error.message)
      return NextResponse.json({ ok: true })
    }
    console.error('Error procesando webhook de fal', error)
    return new NextResponse('Error interno', { status: 500 }) // fal reintentará
  }

  return NextResponse.json({ ok: true })
}

async function downloadBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`No se pudo descargar ${url}: ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}

// Primera etapa de un job ANIMATE: la restauración terminó. Se descarga el
// resultado, se reclama el salto de etapa de forma atómica (evita el doble
// submit si el webhook llega duplicado) y solo entonces se lanza Kling.
async function handleRestoreLegDone(job: PrismaJob, payload: unknown): Promise<void> {
  const restoredFalUrl = extractRestoreImageUrl(payload)

  const bytes = await downloadBytes(restoredFalUrl)
  const restoredBlobUrl = await storage.put(
    `jobs/${job.userId}/${job.id}-restored.jpg`,
    bytes,
    'image/jpeg',
  )

  const claimed = await prisma.job.updateMany({
    where: { id: job.id, falRequestId: job.falRequestId, stage: 'RESTORING', status: 'PROCESSING' },
    data: { stage: 'ANIMATING', restoredUrl: restoredBlobUrl },
  })
  if (claimed.count === 0) {
    // Otra entrega concurrente ya reclamó este salto de etapa.
    return
  }

  try {
    // La URL de fal (v3.fal.media) todavía sirve la imagen — se pasa
    // directo a Kling, sin re-subir a fal.storage.
    const requestId = await submitAnimate(restoredFalUrl)
    await prisma.job.update({ where: { id: job.id }, data: { falRequestId: requestId } })
  } catch (error) {
    console.error('No se pudo iniciar la animación', error)
    await failJobAndRefund(job.id, 'No se pudo iniciar la animación')
  }
}

// Etapa final: restauración sola, o el video ya terminado. Descarga,
// procesa (marca de agua si es vista previa gratuita), sube a Blob y
// reclama la escritura final de forma atómica.
async function handleFinalSuccess(job: PrismaJob, payload: unknown): Promise<void> {
  const isVideo = job.type === 'ANIMATE'
  const sourceUrl = isVideo ? extractVideoUrl(payload) : extractRestoreImageUrl(payload)
  let bytes = await downloadBytes(sourceUrl)
  const contentType = isVideo ? 'video/mp4' : 'image/jpeg'

  if (!isVideo && job.tier === 'FREE') {
    bytes = await applyFreePreviewWatermark(bytes)
  }

  const extension = isVideo ? 'mp4' : 'jpg'
  const blobUrl = await storage.put(`jobs/${job.userId}/${job.id}-output.${extension}`, bytes, contentType)

  const claimed = await prisma.job.updateMany({
    where: { id: job.id, falRequestId: job.falRequestId, status: 'PROCESSING' },
    data: { status: 'COMPLETED', stage: 'DONE', outputUrl: blobUrl },
  })
  if (claimed.count === 0) {
    // Otra entrega ya completó el job — no dejamos un blob huérfano.
    await storage.delete(blobUrl).catch(() => {})
  }
}
