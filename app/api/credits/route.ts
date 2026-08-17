import { type NextRequest, NextResponse } from 'next/server'
import { getBalance } from '@/lib/credits'
import { getUserId } from '@/lib/cookies'
import { enforceGeneralRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = await enforceGeneralRateLimit(request)
  if (limited) return limited

  const userId = await getUserId()
  const balance = await getBalance(userId)
  return NextResponse.json(balance)
}

// Comprar créditos ahora es POST /api/checkout (crea la sesión de Stripe
// Checkout) + POST /api/webhooks/stripe (acredita al confirmarse el pago).
// Esta ruta ya no necesita un POST propio.
