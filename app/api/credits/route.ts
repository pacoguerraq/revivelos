import { NextResponse } from 'next/server'
import { creditsStore } from '@/lib/stores'
import { getUserId } from '@/lib/cookies'

export async function GET() {
  const userId = await getUserId()
  const balance = creditsStore.get(userId)
  return NextResponse.json(balance)
}

// TODO: integrar Stripe — reemplazar este handler con verificación de webhook de Stripe
export async function POST() {
  return NextResponse.json(
    { error: 'Pagos no disponibles aún' },
    { status: 503 },
  )
}
