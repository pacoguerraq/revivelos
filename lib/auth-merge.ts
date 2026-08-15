import { prisma } from './db'

// Fusiona siempre anónimo → autenticado, nunca al revés. Eso es lo que
// permite que el `user.id` que Auth.js sigue usando después de este
// callback (para crear la Session) ya sea el id correcto sin tener que
// mutarlo a mano — el id que sobrevive es siempre authUserId.
//
// Cubre los tres casos (correo nuevo, cuenta ya existente, anónimo vacío)
// con el mismo código: si el anónimo no tiene nada que aportar, el único
// trabajo real es el DELETE de una fila vacía.
export async function mergeAnonymousUser(anonUserId: string, authUserId: string): Promise<void> {
  if (anonUserId === authUserId) {
    // Mismo dispositivo, ya fusionado en un login anterior — no-op.
    await prisma.user.update({ where: { id: authUserId }, data: { isAnonymous: false } })
    return
  }

  const anon = await prisma.user.findUnique({
    where: { id: anonUserId },
    select: {
      credits: true,
      freeUsed: true,
      _count: { select: { jobs: true, transactions: true } },
    },
  })

  if (!anon) {
    // La cookie apuntaba a un uid que nunca llegó a crear un User
    // (ensureUser se llama en el primer POST /api/jobs, no en cada visita).
    // No hay nada que migrar, pero el usuario autenticado de todos modos
    // deja de ser anónimo — sin este update, isAnonymous se queda en su
    // default (true) para toda cuenta nueva sin actividad previa.
    await prisma.user.update({ where: { id: authUserId }, data: { isAnonymous: false } })
    return
  }

  const hasSomethingToMerge =
    anon.credits > 0 || anon.freeUsed || anon._count.jobs > 0 || anon._count.transactions > 0

  await prisma.$transaction(async (tx) => {
    if (hasSomethingToMerge) {
      await tx.job.updateMany({ where: { userId: anonUserId }, data: { userId: authUserId } })
      await tx.creditTransaction.updateMany({ where: { userId: anonUserId }, data: { userId: authUserId } })
      await tx.user.update({
        where: { id: authUserId },
        data: {
          isAnonymous: false,
          credits: { increment: anon.credits },
          freeUsed: anon.freeUsed ? true : undefined, // OR lógico: solo forzamos a true, nunca a false
        },
      })
    } else {
      await tx.user.update({ where: { id: authUserId }, data: { isAnonymous: false } })
    }

    // deleteMany en vez de delete: si dos sign-ins casi simultáneos (doble
    // clic en el magic link, dos pestañas) llegan a fusionar el mismo
    // anónimo, el segundo no debe reventar con P2025 por una fila que el
    // primero ya borró — deleteMany devuelve count 0 y no truena la
    // transacción.
    await tx.user.deleteMany({ where: { id: anonUserId } })
  })
}
