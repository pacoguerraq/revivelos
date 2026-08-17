import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Auth propia y deliberadamente simple, separada de Auth.js: el admin es
// una sola persona (el dueño del negocio), no un usuario del producto. Ver
// AGENTS.md, sección "Panel de administración".
const COOKIE_NAME = 'admin_session'
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000 // 8 horas

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD)
}

// Compara por hash de longitud fija antes de timingSafeEqual — comparar
// buffers de distinta longitud directamente ya filtra la longitud de la
// contraseña esperada (timingSafeEqual lanza si difieren), así que se
// homogeneiza el tamaño primero con SHA-256.
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

export function checkAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return safeEqual(candidate, expected)
}

// La cookie se firma con HMAC derivado de ADMIN_PASSWORD — no hace falta un
// secreto nuevo, y si la contraseña cambia todas las sesiones firmadas con
// la anterior quedan invalidadas automáticamente.
function sign(payload: string): string {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) throw new Error('ADMIN_PASSWORD no está definida')
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export async function createAdminSession(): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_MS
  const payload = String(expiresAt)
  const value = `${payload}.${sign(payload)}`
  const store = await cookies()
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  })
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

function isValidSessionValue(value: string | undefined): boolean {
  if (!value || !isAdminConfigured()) return false
  const [payload, sig] = value.split('.')
  if (!payload || !sig) return false
  if (!safeEqual(sig, sign(payload))) return false
  const expiresAt = Number(payload)
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false
  return true
}

export async function verifyAdminSession(): Promise<boolean> {
  if (!isAdminConfigured()) return false
  const store = await cookies()
  return isValidSessionValue(store.get(COOKIE_NAME)?.value)
}

// Para usar al inicio de cada ruta bajo /api/admin/*. Devuelve 404 (no 401)
// tanto si el admin no está configurado como si la sesión no es válida —
// nunca se anuncia que la ruta existe a quien no tiene la cookie correcta.
export async function requireAdmin(): Promise<NextResponse | null> {
  if (!(await verifyAdminSession())) {
    return new NextResponse(null, { status: 404 })
  }
  return null
}
