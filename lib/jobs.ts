import { prisma } from './db'
import { InsufficientCreditsError } from './credits'
import { RESTORE_COST, ANIMATE_COST } from './pricing'
import type { Job as PrismaJob } from '@prisma/client'
import type { Job, JobStatus, JobType } from './types'

const TYPE_TO_PRISMA = { restore: 'RESTORE', animate: 'ANIMATE' } as const

// El job en DB guarda URLs de blob reales; nunca se exponen directo al
// cliente — todo pasa por el proxy /api/image/[jobId] que valida dueño.
export function toApiJob(job: PrismaJob): Job {
  return {
    id: job.id,
    status: job.status.toLowerCase() as JobStatus,
    type: job.type.toLowerCase() as JobType,
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
// del job — nunca queda un job huérfano en PENDING.
export async function createJobAndCharge(params: {
  userId: string
  type: JobType
  inputUrl: string
}): Promise<PrismaJob> {
  const { userId, type, inputUrl } = params
  const prismaType = TYPE_TO_PRISMA[type]
  const cost = type === 'animate' ? ANIMATE_COST : RESTORE_COST

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
    const isFreeRestore = type === 'restore' && !user.freeUsed
    const tier = isFreeRestore ? 'FREE' : 'PAID'

    const job = await tx.job.create({
      data: {
        userId,
        type: prismaType,
        tier,
        inputUrl,
        watermarked: tier === 'FREE',
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

export async function getJobForUser(jobId: string, userId: string): Promise<PrismaJob | null> {
  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job || job.userId !== userId) return null
  return job
}

export async function updateJobStatus(
  jobId: string,
  data: Partial<Pick<PrismaJob, 'status' | 'outputUrl' | 'error'>>,
) {
  await prisma.job.update({ where: { id: jobId }, data })
}
