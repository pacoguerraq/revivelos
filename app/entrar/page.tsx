import { redirect } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { CameraIcon } from '@/components/icons/CameraIcon'

const description = 'Entra a tu cuenta de Revívelos con Google o con un enlace a tu correo. Sin contraseñas.'

export const metadata = {
  title: 'Entrar',
  description,
  alternates: { canonical: '/entrar' },
  openGraph: { title: 'Entrar — Revívelos', description },
}

// Validación simple y deliberadamente permisiva — solo descarta basura
// obvia. El `type="email"` del navegador ya ayuda, pero es trivial de
// saltarse (POST directo), así que el servidor no puede confiar en él.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Solo rutas relativas propias del sitio — nunca redirigir a una URL externa
// que venga de un query param sin validar (open redirect).
function safeCallbackUrl(value: string | undefined): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value
  return '/'
}

async function googleSignIn(formData: FormData) {
  'use server'
  const callbackUrl = safeCallbackUrl(formData.get('callbackUrl') as string | null ?? undefined)
  await signIn('google', { redirectTo: callbackUrl })
}

async function emailSignIn(formData: FormData) {
  'use server'
  const email = formData.get('email')
  const callbackUrl = safeCallbackUrl(formData.get('callbackUrl') as string | null ?? undefined)
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    redirect(`/entrar?error=correo-invalido&callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }
  await signIn('resend', { email: email.trim().toLowerCase(), redirectTo: callbackUrl })
}

interface Props {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}

export default async function EntrarPage({ searchParams }: Props) {
  const { error, callbackUrl: rawCallbackUrl } = await searchParams
  const callbackUrl = safeCallbackUrl(rawCallbackUrl)

  return (
    <div className="py-16 sm:py-24">
      <div className="section-wrap" style={{ maxWidth: 420, margin: '0 auto' }}>
        <div className="text-center mb-10">
          <div className="mb-4 flex justify-center" style={{ color: 'var(--color-amber)' }}>
            <CameraIcon size={36} />
          </div>
          <h1
            className="font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2rem)' }}
          >
            Entra a tu cuenta
          </h1>
          <p style={{ color: 'var(--color-bark-muted)' }}>
            Sin contraseñas. Elige cómo quieres entrar.
          </p>
        </div>

        <form action={googleSignIn}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <button
            type="submit"
            className="btn btn-secondary w-full flex items-center justify-center gap-3"
            style={{ fontSize: '1rem' }}
          >
            <GoogleIcon size={20} />
            Continuar con Google
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div style={{ flex: 1, height: 1, background: 'var(--color-sepia-100)' }} />
          <span className="text-sm" style={{ color: 'var(--color-bark-muted)' }}>o</span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-sepia-100)' }} />
        </div>

        {error === 'correo-invalido' && (
          <p
            className="text-sm text-center mb-4 p-3 rounded-lg"
            style={{ color: 'var(--color-error)', background: '#FEF2F2', border: '1px solid #FECACA' }}
          >
            Ese correo no se ve válido. Revísalo e intenta de nuevo.
          </p>
        )}

        <form action={emailSignIn}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <label
            htmlFor="email"
            className="block text-sm font-semibold mb-2"
            style={{ color: 'var(--color-bark)' }}
          >
            Te enviamos un enlace a tu correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="tu@correo.com"
            className="w-full rounded-lg"
            style={{
              minHeight: 52,
              padding: '0 16px',
              fontSize: '1rem',
              border: '1px solid var(--color-sepia-200)',
              background: 'var(--color-warm-white)',
              color: 'var(--color-bark)',
            }}
          />
          <button
            type="submit"
            className="btn btn-primary w-full mt-3"
            style={{ fontSize: '1rem' }}
          >
            Enviar enlace de acceso
          </button>
        </form>

        <p className="text-xs text-center mt-8" style={{ color: 'var(--color-sepia-300)' }}>
          No usamos contraseñas. Solo confirmamos que el correo es tuyo con un enlace.
        </p>
      </div>
    </div>
  )
}
