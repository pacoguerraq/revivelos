import { signIn } from '@/lib/auth'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { CameraIcon } from '@/components/icons/CameraIcon'

export const metadata = {
  title: 'Entrar — Revívelos',
}

async function googleSignIn() {
  'use server'
  await signIn('google', { redirectTo: '/' })
}

async function emailSignIn(formData: FormData) {
  'use server'
  const email = formData.get('email')
  if (typeof email !== 'string' || !email) return
  await signIn('resend', { email, redirectTo: '/' })
}

export default function EntrarPage() {
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

        <form action={emailSignIn}>
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
