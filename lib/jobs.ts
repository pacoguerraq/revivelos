import { prisma } from './db'
import { InsufficientCreditsError } from './credits'
import { RESTORE_COST, ANIMATE_COST } from './pricing'
import type { Job as PrismaJob } from '@prisma/client'
import type { Job, JobStage, JobStatus, JobType } from './types'

const TYPE_TO_PRISMA = { restore: 'RESTORE', animate: 'ANIMATE' } as const
const PROCESSING_TIMEOUT_MS = 15 * 60 * 1000

// El job en DB guarda URLs de blob reales; nunca se exponen directo al
// cliente — todo pasa por el proxy /api/image/[jobId] que valida dueño.
export function toApiJob(job: PrismaJob): Job {
  return {
    id: job.id,
    status: job.status.toLowerCase() as JobStatus,
    type: job.type.toLowerCase() as JobType,
    stage: job.stage.toLowerCase() as JobStage,
    inputUrl: `/api/image/${job.id}?v=input`,
    outputUrl: job.outputUrl ? `/api/image/${job.id}?v=output` : null,
    watermarked: job.watermarked,
    error: job.error,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    userId: job.userId,
  }
}

// Crea el job y descuenta el crédito (o consume la restauración gratis) en una
// sola transacción: si el saldo no alcanza, se revierte también la creación
// del job — nunca queda un job huérfano en PENDING. No hace llamadas de red.
//
// `fingerprint` es la segunda capa antiabuso del free tier (además de
// User.freeUsed): se reclama de forma atómica con un UPSERT condicional en
// SQL crudo — Prisma no expresa "UPDATE ... WHERE freeUsed = false, o
// INSERT si no existe" como una sola operación atómica por su cliente
// tipado. Si el fingerprint ya se usó, se degrada a PAID silenciosamente
// (sin bloquear al usuario, solo le cobra si tiene crédito).
export async function createJobAndCharge(params: {
  userId: string
  type: JobType
  inputUrl: string
  fingerprint?: string
}): Promise<PrismaJob> {
  const { userId, type, inputUrl, fingerprint } = params
  const prismaType = TYPE_TO_PRISMA[type]
  const cost = type === 'animate' ? ANIMATE_COST : RESTORE_COST

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
    let isFreeRestore = type === 'restore' && !user.freeUsed
    let claimedFingerprint: string | null = null

    if (isFreeRestore && fingerprint) {
      const claimed = await tx.$executeRaw`
        INSERT INTO "DeviceFingerprint" (id, "freeUsed", "createdAt", "updatedAt")
        VALUES (${fingerprint}, true, now(), now())
        ON CONFLICT (id) DO UPDATE SET "freeUsed" = true, "updatedAt" = now()
        WHERE "DeviceFingerprint"."freeUsed" = false
      `
      if (claimed === 0) {
        // Este dispositivo ya usó su vista previa gratis con otro uid
        // (incógnito, cookies borradas, etc.) — se cobra como cualquier otra.
        isFreeRestore = false
      } else {
        claimedFingerprint = fingerprint
      }
    }

    const tier = isFreeRestore ? 'FREE' : 'PAID'

    const job = await tx.job.create({
      data: {
        userId,
        type: prismaType,
        tier,
        inputUrl,
        watermarked: tier === 'FREE',
        deviceFingerprint: claimedFingerprint,
      },
    })

    if (isFreeRestore) {
      const result = await tx.user.updateMany({
        where: { id: userId, freeUsed: false },
        data: { freeUsed: true },
      })
      if (result.count === 0) throw new InsufficientCreditsError()
      await tx.creditTransaction.create({
        data: { userId, delta: 0, reason: 'FREE_PREVIEW', jobId: job.id },
      })
    } else {
      const result = await tx.user.updateMany({
        where: { id: userId, credits: { gte: cost } },
        data: { credits: { decrement: cost } },
      })
      if (result.count === 0) throw new InsufficientCreditsError()
      await tx.creditTransaction.create({
        data: {
          userId,
          delta: -cost,
          reason: prismaType,
          jobId: job.id,
        },
      })
    }

    return job
  })
}

// Se llama justo después de fal.queue.submit — sin llamadas de red.
export async function markSubmitted(jobId: string, falRequestId: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: { status: 'PROCESSING', falRequestId },
  })
}

// Marca el job como FAILED y reembolsa el crédito (o revierte freeUsed si
// era la vista previa gratuita) en una sola transacción corta, sin red.
// Idempotente: el updateMany condicional garantiza que solo la primera
// llamada concurrente aplica el reembolso.
export async function failJobAndRefund(jobId: string, message: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.job.updateMany({
      where: { id: jobId, status: { in: ['PENDING', 'PROCESSING'] } },
      data: { status: 'FAILED', error: message, stage: 'DONE' },
    })
    if (claimed.count === 0) return // ya se resolvió (completado o fallado) por otra entrega

    const job = await tx.job.findUniqueOrThrow({ where: { id: jobId } })

    if (job.tier === 'PAID') {
      const cost = job.type === 'ANIMATE' ? ANIMATE_COST : RESTORE_COST
      await tx.user.update({
        where: { id: job.userId },
        data: { credits: { increment: cost } },
      })
      await tx.creditTransaction.create({
        data: { userId: job.userId, delta: cost, reason: 'REFUND', jobId },
      })
    } else {
      await tx.user.update({
        where: { id: job.userId },
        data: { freeUsed: false },
      })
      if (job.deviceFingerprint) {
        await tx.deviceFingerprint.update({
          where: { id: job.deviceFingerprint },
          data: { freeUsed: false },
        })
      }
    }
  })
}

export async function getJobForUser(jobId: string, userId: string): Promise<PrismaJob | null> {
  let job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job || job.userId !== userId) return null

  if (job.status === 'PROCESSING' && Date.now() - job.updatedAt.getTime() > PROCESSING_TIMEOUT_MS) {
    await failJobAndRefund(job.id, 'El procesamiento tardó demasiado y no obtuvimos respuesta.')
    job = await prisma.job.findUnique({ where: { id: jobId } })
  }

  return job
}
