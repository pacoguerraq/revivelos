import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { adjustCreditsByAdmin, InsufficientCreditsError } from '@/lib/credits'

interface Params {
  params: Promise<{ userId: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { userId } = await params
  const body = await request.json().catch(() => null)
  const delta = Number(body?.delta)
  const note = typeof body?.note === 'string' ? body.note : ''

  if (!Number.isInteger(delta) || delta === 0) {
    return NextResponse.json({ error: 'El ajuste debe ser un entero distinto de cero' }, { status: 400 })
  }
  if (!note.trim()) {
    return NextResponse.json({ error: 'El motivo es obligatorio' }, { status: 400 })
  }

  try {
    await adjustCreditsByAdmin({ userId, delta, note })
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json({ error: 'Ese ajuste dejaría el saldo en negativo' }, { status: 400 })
    }
    throw error
  }

  return NextResponse.json({ ok: true })
}
