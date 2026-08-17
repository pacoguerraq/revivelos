import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ANON_UID_COOKIE = 'uid'
// Nombres de cookie de sesión de Auth.js v5 — dev/http usa el primero,
// producción/https (useSecureCookies) usa el prefijo __Secure-. Solo se
// verifica que exista, no se valida (eso lo hace auth() donde sí hay DB
// disponible) — basta para no emitir un uid anónimo a alguien ya logueado.
const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token']

const ADMIN_SESSION_COOKIE = 'admin_session'

// HMAC con Web Crypto (no node:crypto) porque proxy.ts corre en el runtime
// de Proxy/Middleware, que puede ser Edge — hay que evitar cualquier API
// exclusiva de Node. El secreto y el algoritmo coinciden exactamente con
// lib/admin-auth.ts (que sí puede usar node:crypto porque solo se importa
// desde Route Handlers y Server Components).
function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return toBase64Url(sig)
}

async function isValidAdminSession(cookieValue: string | undefined, secret: string): Promise<boolean> {
  if (!cookieValue) return false
  const [payload, sig] = cookieValue.split('.')
  if (!payload || !sig) return false
  if (sig !== (await sign(payload, secret))) return false
  const expiresAt = Number(payload)
  return Number.isFinite(expiresAt) && Date.now() <= expiresAt
}

// El check de admin vive aquí (y no solo en app/admin/layout.tsx) porque
// esta app tiene un app/loading.tsx raíz: eso hace que TODA ruta streamee
// un shell con 200 antes de que un notFound() más adentro del árbol pueda
// resolverse, así que un 404 "de React" nunca llega a ser el status code
// real de la respuesta (confirmado probando /resultado/<id-inexistente>,
// que ya tenía este mismo comportamiento antes del panel de admin). Un
// 404 de verdad, sin renderizar nada de React, solo se puede garantizar
// aquí, antes de que empiece el streaming.
async function guardAdmin(request: NextRequest): Promise<NextResponse | null> {
  if (!request.nextUrl.pathname.startsWith('/admin')) return null

  const secret = process.env.ADMIN_PASSWORD
  if (!secret) return new NextResponse(null, { status: 404 })

  // /admin es la página de login — no requiere la cookie, solo que el
  // panel esté configurado (ya verificado arriba).
  if (request.nextUrl.pathname === '/admin') return null

  const valid = await isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value, secret)
  if (!valid) return new NextResponse(null, { status: 404 })

  return null
}

export async function proxy(request: NextRequest) {
  const adminBlock = await guardAdmin(request)
  if (adminBlock) return adminBlock

  const response = NextResponse.next()

  // OJO: la respuesta de /api/auth/signout limpia la cookie de sesión con
  // `Set-Cookie: ...session-token=;` sin Expires/Max-Age — el navegador la
  // conserva como cookie de sesión con valor vacío hasta que se cierra, en
  // vez de borrarla. Por eso se revisa .value, no solo presencia con
  // .get()/.has(): una cookie vacía "presente" no debe contar como sesión,
  // o después de salir nunca se emite un uid nuevo y getUserId() cae al
  // literal 'anonymous' compartido entre cualquiera en ese estado.
  const hasSession = SESSION_COOKIES.some((name) => Boolean(request.cookies.get(name)?.value))
  if (hasSession) return response

  if (!request.cookies.get(ANON_UID_COOKIE)) {
    const uid = crypto.randomUUID()
    response.cookies.set(ANON_UID_COOKIE, uid, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
