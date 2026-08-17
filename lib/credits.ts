import { Prisma } from '@prisma/client'
import { prisma } from './db'
import type { CreditBalance } from './types'

export class InsufficientCreditsError extends Error {
  constructor() {
    super('Saldo insuficiente')
    this.name = 'InsufficientCreditsError'
  }
}

// Se lanza cuando el tope diario de vistas previas gratuitas ya se alcanzó,
// o cuando el kill switch FREE_TIER_ENABLED está apagado. Nunca afecta
// generaciones de pago — ver createJobAndCharge en lib/jobs.ts.
export class FreeTierUnavailableError extends Error {
  constructor() {
    super('Vista previa gratuita no disponible por hoy')
    this.name = 'FreeTierUnavailableError'
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

// Acredita una compra confirmada por un proveedor de pago externo (hoy:
// webhook de Stripe; mañana, sin cambiar esta función, cualquier otro
// proveedor que mande un id de pago/sesión propio). Idempotente: la
// restricción @unique en CreditTransaction.externalId es lo que de verdad
// impide un doble abono ante un reintento del webhook — no un `findFirst`
// previo, que sería vulnerable a una carrera entre dos entregas casi
// simultáneas. Se distingue el resultado con `alreadyProcessed` para que el
// caller pueda responder 200 igual sin tratarlo como error.
export async function addCreditsFromPurchase(params: {
  userId: string
  amount: number
  externalId: string
}): Promise<{ alreadyProcessed: boolean }> {
  const { userId, amount, externalId } = params
  await ensureUser(userId)
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: amount } },
      }),
      prisma.creditTransaction.create({
        data: { userId, delta: amount, reason: 'PURCHASE', externalId },
      }),
    ])
    return { alreadyProcessed: false }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { alreadyProcessed: true }
    }
    throw error
  }
}

// Único punto que permite a un humano (el admin) tocar User.credits fuera
// del flujo normal de compra/consumo/reembolso. Igual que el resto de
// lib/credits.ts, nunca es un `update` suelto: el `updateMany` condicional
// (`credits >= -delta`, válido para delta positivo o negativo) impide dejar
// el saldo negativo dentro de la misma transacción que crea el
// CreditTransaction — nunca queda un ajuste sin rastro en el historial.
export async function adjustCreditsByAdmin(params: {
  userId: string
  delta: number
  note: string
}): Promise<void> {
  const { userId, delta, note } = params
  if (!Number.isInteger(delta) || delta === 0) throw new Error('El ajuste debe ser un entero distinto de cero')
  if (!note.trim()) throw new Error('El motivo es obligatorio')

  await prisma.$transaction(async (tx) => {
    const result = await tx.user.updateMany({
      where: { id: userId, credits: { gte: -delta } },
      data: { credits: { increment: delta } },
    })
    if (result.count === 0) throw new InsufficientCreditsError()

    await tx.creditTransaction.create({
      data: { userId, delta, reason: 'ADMIN_ADJUSTMENT', note: note.trim() },
    })
  })
}
