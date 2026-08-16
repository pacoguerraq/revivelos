import { NextResponse } from 'next/server'
import { prisma } from './db'

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super('Demasiadas solicitudes')
    this.name = 'RateLimitError'
  }
}

// Ventana fija en Postgres — sin Redis. El upsert en un solo statement es
// atómico: dos requests simultáneas en la misma ventana nunca se pisan el
// conteo (a diferencia de un "leer, sumar uno, escribir" en dos pasos).
// Trade-off documentado en AGENTS.md: un round-trip extra a la DB por
// request limitado, aceptable al volumen de tráfico de este producto.
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs)

  const result = await prisma.rateLimitHit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  })

  if (result.count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((windowStart.getTime() + windowMs - Date.now()) / 1000))
    throw new RateLimitError(retryAfterSeconds)
  }
}

// Corre varios límites en paralelo (p.ej. por IP y por usuario a la vez) y
// lanza en cuanto el primero falla, sin esperar a los demás.
export async function checkRateLimits(checks: { key: string; limit: number; windowMs: number }[]): Promise<void> {
  await Promise.all(checks.map((c) => checkRateLimit(c.key, c.limit, c.windowMs)))
}

// Límite general para el resto de la API (lectura de estado/imagen/saldo):
// mucho más holgado que /api/jobs — el poller de ProgressStages consulta
// cada 2s durante varios minutos en un video, así que tiene que caber
// cómodo una sesión normal y solo cortar un abuso claro (scraping, bots).
const GENERAL_LIMIT = 300
const GENERAL_WINDOW_MS = 10 * 60 * 1000

// Envuelve el patrón repetido: si se pasa del límite general, devuelve la
// respuesta 429 lista para retornar; si no, null y el caller sigue normal.
export async function enforceGeneralRateLimit(request: Request): Promise<NextResponse | null> {
  const ip = getClientIp(request)
  try {
    await checkRateLimit(`general:ip:${ip}`, GENERAL_LIMIT, GENERAL_WINDOW_MS)
    return null
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } },
      )
    }
    throw error
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

// Limpieza oportunista: cada vez que alguien golpea un límite ya vencido,
// hay una probabilidad baja de barrer ventanas viejas en vez de dejar la
// tabla crecer indefinidamente. No sustituye un cron real (pendiente junto
// con el resto de la limpieza de Fase 3), pero evita que la tabla explote
// mientras tanto sin agregar infraestructura nueva.
const CLEANUP_PROBABILITY = 0.01
export async function maybeCleanupOldHits(maxAgeMs: number): Promise<void> {
  if (Math.random() > CLEANUP_PROBABILITY) return
  const cutoff = new Date(Date.now() - maxAgeMs)
  await prisma.rateLimitHit.deleteMany({ where: { windowStart: { lt: cutoff } } }).catch(() => {})
}
