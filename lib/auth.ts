import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { cookies } from 'next/headers'
import { prisma } from './db'
import { mergeAnonymousUser } from './auth-merge'
import { sendMagicLinkEmail } from './email'
import { ANON_UID_COOKIE, clearAnonUidCookie, setAnonUidCookie } from './cookies'
import type { GoogleProfile } from 'next-auth/providers/google'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} no está definida. Agrégala a .env.local antes de arrancar.`)
  }
  return value
}

// Falla temprano y claro en vez de un error críptico de Auth.js a medio arrancar.
requireEnv('AUTH_SECRET')
requireEnv('AUTH_GOOGLE_ID')
requireEnv('AUTH_GOOGLE_SECRET')
requireEnv('AUTH_RESEND_KEY')
requireEnv('EMAIL_FROM')

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  pages: {
    signIn: '/entrar',
    verifyRequest: '/entrar/revisa-tu-correo',
  },
  providers: [
    Google({
      clientId: requireEnv('AUTH_GOOGLE_ID'),
      clientSecret: requireEnv('AUTH_GOOGLE_SECRET'),
      // Permite que un login de Google se enlace automáticamente a una
      // cuenta existente con el mismo correo (p.ej. creada antes por magic
      // link), en vez de fallar con OAuthAccountNotLinked.
      //
      // ¿Por qué es seguro AQUÍ y no en general? Porque las dos partes que
      // se están enlazando ya probaron ser dueñas del correo por caminos
      // independientes: Google solo llega a este punto con
      // profile.email_verified === true (lo exigimos nosotros mismos más
      // abajo, Google no lo garantiza por sí solo para todo tipo de cuenta),
      // y un magic link por definición ya demostró posesión del correo al
      // haberlo clickeado. Sin esa doble verificación, activar esta bandera
      // sería peligroso: cualquiera con acceso a un proveedor OAuth que NO
      // verifique correos podría apropiarse de una cuenta ajena con solo
      // registrar ese correo en su lado. Si en el futuro se agrega otro
      // provider OAuth, NO copiar esta bandera sin repetir el mismo
      // análisis para ese provider específico.
      allowDangerousEmailAccountLinking: true,
      // El profile() por defecto de Auth.js solo mapea id/name/email/image.
      // Si no agregamos emailVerified aquí, entra como null al crear el
      // usuario — este es el único punto donde ese valor llega directo al
      // adapter.createUser, sin updates posteriores que dependan de que la
      // fila ya exista.
      profile(profile: GoogleProfile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
        }
      },
    }),
    Resend({
      apiKey: requireEnv('AUTH_RESEND_KEY'),
      from: requireEnv('EMAIL_FROM'),
      sendVerificationRequest: ({ identifier, url }) => sendMagicLinkEmail({ identifier, url }),
    }),
  ],
  callbacks: {
    // Corre ANTES de que exista la fila de User para una cuenta nueva — ver
    // la nota grande en events.signIn más abajo. Aquí solo hacemos una
    // lectura (segura en cualquier punto del flujo), nunca una escritura
    // atada a user.id.
    async signIn({ profile, account }) {
      if (account?.provider === 'google') {
        const googleProfile = profile as GoogleProfile | undefined
        if (googleProfile?.email && !googleProfile.email_verified) {
          // allowDangerousEmailAccountLinking es global al provider, pero
          // el enlace automático a una cuenta AJENA solo debe permitirse
          // si Google verificó el correo. Un correo no verificado no
          // prueba nada, así que si ya existe una cuenta con ese correo,
          // negamos el login en vez de dejar que Auth.js los enlace.
          // (Si NO existe una cuenta previa, dejamos pasar: es solo un
          // registro nuevo con correo sin verificar, no un enlace.)
          try {
            const existing = await prisma.user.findUnique({ where: { email: googleProfile.email } })
            if (existing) return false
          } catch (error) {
            console.error('No se pudo verificar correo existente antes de enlazar Google', error)
            return false // ante la duda, no arriesgar un enlace indebido
          }
        }
      }
      return true
    },
    async session({ session, user }) {
      if (session.user) session.user.id = user.id
      return session
    },
  },
  events: {
    // IMPORTANTE: a diferencia de callbacks.signIn (que corre ANTES de que
    // el adapter cree la fila de User — un usuario nuevo todavía no existe
    // en ese punto), events.signIn corre DESPUÉS de adapter.createUser y de
    // crear la Session. Es el único lugar seguro para tocar la fila del
    // usuario o leer/escribir la cookie sabiendo que ya existe.
    //
    // Nada de esto debe poder tumbar el login: un error aquí, sin atajar,
    // se propaga y Auth.js lo convierte en un AccessDenied silencioso.
    async signIn({ user, account, profile }) {
      if (!user.id) return

      if (account?.provider === 'google') {
        const googleProfile = profile as GoogleProfile | undefined
        try {
          if (googleProfile?.email_verified) {
            // updateMany en vez de update: si el id no matchea (no debería
            // pasar) o el campo ya no es null, es un no-op silencioso, no
            // una excepción que tumbe el login.
            await prisma.user.updateMany({
              where: { id: user.id, emailVerified: null },
              data: { emailVerified: new Date() },
            })
          }
          // Enriquecer el perfil SOLO si el campo está vacío — nunca pisar
          // un nombre/foto que el usuario ya tenía (p.ej. de una cuenta
          // creada antes por magic link, donde no hay nombre; o si ya
          // entró antes con Google y ahora vuelve a entrar).
          if (googleProfile?.name) {
            await prisma.user.updateMany({
              where: { id: user.id, name: null },
              data: { name: googleProfile.name },
            })
          }
          if (googleProfile?.picture) {
            await prisma.user.updateMany({
              where: { id: user.id, image: null },
              data: { image: googleProfile.picture },
            })
          }
        } catch (error) {
          console.error('No se pudo enriquecer el perfil desde Google', error)
        }
      }

      try {
        const cookieStore = await cookies()
        const anonUid = cookieStore.get(ANON_UID_COOKIE)?.value
        if (anonUid) {
          await mergeAnonymousUser(anonUid, user.id)
        }

        // La cookie anónima ahora debe apuntar al usuario ganador — así una
        // pestaña vieja o un refresh posterior no vuelve a crear un usuario
        // anónimo separado. Esto es seguro porque mergeAnonymousUser siempre
        // deja vivo a user.id (el autenticado), nunca al anónimo — la
        // Session que Auth.js ya creó para este login sigue apuntando al id
        // correcto sin que hayamos tenido que mutar nada.
        await setAnonUidCookie(user.id)
      } catch (error) {
        console.error('No se pudo fusionar el usuario anónimo', error)
      }
    },
    async signOut() {
      // Sin esto, `uid` se queda apuntando al id de la cuenta de la que se
      // acaba de salir (setAnonUidCookie la reescribió al iniciar sesión), y
      // ese id sigue siendo una fila real en la DB con crédito real —
      // getUserId() la tomaría como identidad anónima y expondría el saldo
      // de la cuenta sin sesión activa.
      try {
        await clearAnonUidCookie()
      } catch (error) {
        console.error('No se pudo limpiar la cookie anónima al salir', error)
      }
    },
  },
})
