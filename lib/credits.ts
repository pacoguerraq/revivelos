import { prisma } from './db'
import type { CreditBalance } from './types'

export class InsufficientCreditsError extends Error {
  constructor() {
    super('Saldo insuficiente')
    this.name = 'InsufficientCreditsError'
  }
}

// Creación perezosa: la primera vez que aparece un uid de cookie.
export async function ensureUser(userId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  })
}

export async function getBalance(userId: string): Promise<CreditBalance> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true, freeUsed: true },
  })
  return user ?? { credits: 0, freeUsed: false }
}

export async function addCredits(userId: string, amount: number, jobId?: string) {
  await ensureUser(userId)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    }),
    prisma.creditTransaction.create({
      data: { userId, delta: amount, reason: 'PURCHASE', jobId },
    }),
  ])
}
