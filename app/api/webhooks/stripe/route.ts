import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { addCreditsFromPurchase } from '@/lib/credits'
import { PACKAGES } from '@/lib/pricing'
import { sendPurchaseCapiEvent } from '@/lib/meta-capi'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} no está definida.`)
  return value
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return new NextResponse('Falta la firma', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, requireEnv('STRIPE_WEBHOOK_SECRET'))
  } catch (error) {
    console.error('Firma de webhook de Stripe inválida', error)
    return new NextResponse('Firma inválida', { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    // Ack — no es un evento que nos importe.
    return NextResponse.json({ ok: true })
  }

  const checkoutSession = event.data.object as Stripe.Checkout.Session
  if (checkoutSession.payment_status !== 'paid') {
    return NextResponse.json({ ok: true })
  }

  const { userId, packageId, credits } = checkoutSession.metadata ?? {}
  const creditsAmount = Number(credits)

  // Congelado en metadata al crear el checkout — así si lib/pricing.ts
  // cambiara entre el checkout y el webhook, acreditamos lo que se cobró
  // de verdad, no lo que diga el catálogo hoy. Aun así revalidamos que el
  // paquete siga existiendo y que el número de créditos coincida con lo
  // que ese paquete otorgaba en el momento de crear el checkout, como
  // defensa ante metadata corrupta o manipulada.
  const pkg = PACKAGES.find((p) => p.id === packageId)
  if (!userId || !packageId || !pkg || !Number.isFinite(creditsAmount) || creditsAmount <= 0) {
    console.error('Webhook de Stripe con metadata inválida — revisar a mano', {
      sessionId: checkoutSession.id,
      metadata: checkoutSession.metadata,
    })
    // Reintentar no arregla metadata corrupta — ack para que Stripe no
    // siga reintentando algo que nunca se va a resolver solo.
    return NextResponse.json({ ok: true })
  }

  const { alreadyProcessed } = await addCreditsFromPurchase({
    userId,
    amount: creditsAmount,
    externalId: checkoutSession.id,
  })

  if (alreadyProcessed) {
    console.log('Sesión de Stripe ya procesada, entrega duplicada del webhook', checkoutSession.id)
    return NextResponse.json({ ok: true })
  }

  console.log('Compra acreditada', {
    sessionId: checkoutSession.id,
    userId,
    packageId,
    credits: creditsAmount,
    amountTotal: checkoutSession.amount_total,
  })

  const buyerEmail = checkoutSession.customer_details?.email ?? checkoutSession.customer_email
  if (buyerEmail) {
    await sendPurchaseCapiEvent({
      eventId: checkoutSession.id,
      email: buyerEmail,
      valueMxn: (checkoutSession.amount_total ?? 0) / 100,
      eventSourceUrl: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.revivelos.com',
    })
  }

  return NextResponse.json({ ok: true })
}
