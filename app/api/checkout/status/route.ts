import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { enforceGeneralRateLimit } from '@/lib/rate-limit'

// Consultada por /gracias mientras espera a que el webhook de Stripe
// llegue y acredite los créditos. La fuente de verdad de si una compra ya
// se acreditó es que exista un CreditTransaction con ese externalId — esta
// ruta solo LEE, nunca acredita nada (eso es trabajo exclusivo del
// webhook).
export async function GET(request: NextRequest) {
  const limited = await enforceGeneralRateLimit(request)
  if (limited) return limited

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const sessionId = request.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ error: 'Falta session_id' }, { status: 400 })
  }

  const tx = await prisma.creditTransaction.findFirst({
    where: { externalId: sessionId, userId: session.user.id },
    select: { delta: true },
  })

  if (!tx) {
    return NextResponse.json({ confirmed: false })
  }

  // El saldo mostrado siempre sale de una lectura fresca de la DB — nunca
  // se calcula sumando el delta a un saldo leído antes (esa aritmética en
  // el cliente es justo lo que causaba el saldo inflado: si la página
  // /gracias ya se había cargado (o recargado) después de que el webhook
  // acreditara, sumarle el delta otra vez duplicaba el crédito en pantalla
  // sin que la DB estuviera mal).
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  })

  return NextResponse.json({ confirmed: true, creditsAdded: tx.delta, balance: user?.credits ?? 0 })
}
