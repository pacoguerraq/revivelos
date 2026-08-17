import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY no está definida. Agrégala a .env antes de arrancar.')
}

// Singleton igual que lib/db.ts — evita instanciar un cliente nuevo en cada
// import durante hot reload.
const globalForStripe = globalThis as unknown as { stripe?: Stripe }

export const stripe = globalForStripe.stripe ?? new Stripe(process.env.STRIPE_SECRET_KEY)

if (process.env.NODE_ENV !== 'production') {
  globalForStripe.stripe = stripe
}
