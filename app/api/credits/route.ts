import { NextResponse } from 'next/server'
import { getBalance } from '@/lib/credits'
import { getUserId } from '@/lib/cookies'

export async function GET() {
  const userId = await getUserId()
  const balance = await getBalance(userId)
  return NextResponse.json(balance)
}

// TODO: integrar Stripe — reemplazar este handler con verificación de webhook de Stripe
export async function POST() {
  return NextResponse.json(
    { error: 'Pagos no disponibles aún' },
    { status: 503 },
  )
}
