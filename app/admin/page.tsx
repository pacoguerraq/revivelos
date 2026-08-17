import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { checkAdminPassword, createAdminSession, verifyAdminSession } from '@/lib/admin-auth'
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit'

async function clientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return h.get('x-real-ip') ?? 'unknown'
}

async function login(formData: FormData) {
  'use server'
  const password = formData.get('password')
  const ip = await clientIp()

  try {
    await checkRateLimit(`admin:login:ip:${ip}`, 5, 15 * 60 * 1000)
  } catch (error) {
    if (error instanceof RateLimitError) redirect('/admin?error=rate-limited')
    throw error
  }

  if (typeof password !== 'string' || !checkAdminPassword(password)) {
    redirect('/admin?error=incorrecta')
  }

  await createAdminSession()
  redirect('/admin/dashboard')
}

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function AdminLoginPage({ searchParams }: Props) {
  if (await verifyAdminSession()) redirect('/admin/dashboard')
  const { error } = await searchParams

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-cream)' }}>
      <form
        action={login}
        style={{
          width: 320,
          padding: 32,
          background: 'var(--color-warm-white)',
          border: '1px solid var(--color-sepia-100)',
          borderRadius: 12,
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 20 }}>
          Admin — Revívelos
        </h1>

        {error === 'incorrecta' && (
          <p style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: 16 }}>
            Contraseña incorrecta.
          </p>
        )}
        {error === 'rate-limited' && (
          <p style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: 16 }}>
            Demasiados intentos. Espera unos minutos e intenta de nuevo.
          </p>
        )}

        <label htmlFor="password" style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6 }}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          style={{
            width: '100%',
            minHeight: 44,
            padding: '0 12px',
            marginBottom: 16,
            border: '1px solid var(--color-sepia-200)',
            borderRadius: 6,
            background: '#fff',
            color: 'var(--color-bark)',
          }}
        />

        <button type="submit" className="btn btn-primary w-full">
          Entrar
        </button>
      </form>
    </div>
  )
}
