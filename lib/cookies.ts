import { cookies } from 'next/headers'

export const ANON_UID_COOKIE = 'uid'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export async function setAnonUidCookie(userId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ANON_UID_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: ONE_YEAR_SECONDS,
    path: '/',
  })
}

// Se llama al cerrar sesión. setAnonUidCookie() reescribe `uid` al id del
// usuario autenticado al iniciar sesión (para que un login posterior en el
// mismo dispositivo se fusione en vez de crear otro anónimo) — pero eso
// significa que si no se limpia al salir, la cookie se queda apuntando al
// id de una cuenta real ya sin sesión, y getUserId() la usaría como
// identidad anónima: cualquiera con ese navegador seguiría viendo el saldo
// y los créditos de la cuenta de la que se acaba de cerrar sesión, sin
// necesidad de volver a autenticarse.
export async function clearAnonUidCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ANON_UID_COOKIE)
}

// Punto único de resolución de identidad: si hay sesión autenticada, ese es
// el usuario. Si no, el uid anónimo de la cookie. Nada más en el código
// debe leer la cookie `uid` o la sesión directamente para decidir "quién es
// el usuario actual" — todo pasa por aquí.
export async function getUserId(): Promise<string> {
  // Import perezoso: lib/auth.ts importa lib/cookies.ts (para el nombre de
  // la cookie y el setter), así que un import estático aquí crearía un
  // ciclo. auth() en sí no depende de este módulo en tiempo de carga.
  const { auth } = await import('./auth')
  const session = await auth()
  if (session?.user?.id) return session.user.id

  const cookieStore = await cookies()
  const existing = cookieStore.get(ANON_UID_COOKIE)?.value
  if (existing) return existing

  // No debería pasar — proxy.ts asigna `uid` en (casi) cualquier request
  // antes de llegar aquí — pero si pasa, un literal fijo tipo 'anonymous'
  // sería un id compartido entre cualquiera que caiga en este mismo hueco al
  // mismo tiempo (dos personas verían/escribirían el mismo Job/User). Mejor
  // un id nuevo por request, aunque no persista entre requests.
  return crypto.randomUUID()
}
