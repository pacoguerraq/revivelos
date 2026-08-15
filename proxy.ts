import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ANON_UID_COOKIE = 'uid'
// Nombres de cookie de sesión de Auth.js v5 — dev/http usa el primero,
// producción/https (useSecureCookies) usa el prefijo __Secure-. Solo se
// verifica que exista, no se valida (eso lo hace auth() donde sí hay DB
// disponible) — basta para no emitir un uid anónimo a alguien ya logueado.
const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token']

export function proxy(request: NextRequest) {
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
