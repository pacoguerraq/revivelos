import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { PACKAGES } from '@/lib/pricing'
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit'

const HOUR_MS = 60 * 60 * 1000

function baseUrl(request: NextRequest): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin
}

export async function POST(request: NextRequest) {
  // Comprar exige cuenta — los créditos deben sobrevivir a que el usuario
  // borre cookies o cambie de teléfono. Esto NO cambia la regla de que
  // subir foto y ver el resultado sigue sin requerir cuenta.
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Necesitas una cuenta para comprar créditos', code: 'AUTH_REQUIRED' }, { status: 401 })
  }
  const userId = session.user.id

  try {
    await checkRateLimit(`checkout:user:${userId}`, 10, HOUR_MS)
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Muchos intentos de compra. Espera un momento e intenta de nuevo.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } },
      )
    }
    throw error
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const packageId = (body as { packageId?: unknown } | null)?.packageId
  if (typeof packageId !== 'string') {
    return NextResponse.json({ error: 'Falta el paquete a comprar' }, { status: 400 })
  }

  // El cliente solo manda el id del paquete — el precio y los créditos
  // siempre se resuelven aquí, nunca se confía en un monto que mande el
  // cliente.
  const pkg = PACKAGES.find((p) => p.id === packageId)
  if (!pkg) {
    return NextResponse.json({ error: 'Paquete no reconocido' }, { status: 400 })
  }

  const origin = baseUrl(request)

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        // price_data en línea, nunca un Price id del dashboard — lib/pricing.ts
        // es la única fuente de verdad de precios (ver AGENTS.md).
        price_data: {
          currency: 'mxn',
          unit_amount: Math.round(pkg.price * 100),
          product_data: {
            name: `${pkg.name} — ${pkg.credits} créditos Revívelos`,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: session.user.email ?? undefined,
    success_url: `${origin}/gracias?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#precios`,
    // El webhook necesita estos tres datos para acreditar sin volver a
    // confiar en nada que venga del cliente en ese momento.
    metadata: {
      userId,
      packageId: pkg.id,
      credits: String(pkg.credits),
    },
  })

  if (!checkoutSession.url) {
    return NextResponse.json({ error: 'No se pudo crear la sesión de pago' }, { status: 502 })
  }

  return NextResponse.json({ url: checkoutSession.url })
}
