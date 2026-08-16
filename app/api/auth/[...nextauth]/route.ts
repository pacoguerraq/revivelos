import { type NextRequest, NextResponse } from 'next/server'
import { handlers } from '@/lib/auth'
import { checkRateLimits, getClientIp, RateLimitError } from '@/lib/rate-limit'

export const { GET } = handlers

const HOUR_MS = 60 * 60 * 1000

export async function POST(request: NextRequest): Promise<Response> {
  // Solo la acción que manda un correo (magic link) necesita límite propio
  // — es la que se puede usar para bombardear buzones ajenos con enlaces no
  // pedidos, quemando cuota y reputación de nuestro Resend.
  if (request.nextUrl.pathname.endsWith('/signin/resend')) {
    const ip = getClientIp(request)

    // El body es form-urlencoded y solo se puede leer una vez — se clona
    // para no consumirlo antes de que llegue al handler real de Auth.js.
    let email: string | null = null
    try {
      const formData = await request.clone().formData()
      const raw = formData.get('email')
      if (typeof raw === 'string' && raw) email = raw.toLowerCase().trim()
    } catch {
      // Sin email legible, se aplica solo el límite por IP.
    }

    try {
      const checks = [{ key: `auth:ip:${ip}`, limit: 5, windowMs: HOUR_MS }]
      if (email) checks.push({ key: `auth:email:${email}`, limit: 3, windowMs: HOUR_MS })
      await checkRateLimits(checks)
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: 'Ya pediste varios enlaces de acceso. Revisa tu correo o espera antes de pedir otro.' },
          { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } },
        )
      }
      throw error
    }
  }

  return handlers.POST(request)
}
