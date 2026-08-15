import Link from 'next/link'
import { MailIcon } from '@/components/icons/MailIcon'

export const metadata = {
  title: 'Revisa tu correo — Revívelos',
}

interface Props {
  searchParams: Promise<{ email?: string }>
}

export default async function RevisaTuCorreoPage({ searchParams }: Props) {
  const { email } = await searchParams

  return (
    <div className="py-20 text-center">
      <div className="section-wrap" style={{ maxWidth: 440, margin: '0 auto' }}>
        <div className="mb-5 flex justify-center" style={{ color: 'var(--color-amber)' }}>
          <MailIcon size={44} />
        </div>
        <h1
          className="font-bold mb-3"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2rem)' }}
        >
          Revisa tu correo
        </h1>
        <p className="mb-2" style={{ color: 'var(--color-bark-muted)' }}>
          {email
            ? <>Te enviamos un enlace de acceso a <strong style={{ color: 'var(--color-bark)' }}>{email}</strong>.</>
            : 'Te enviamos un enlace de acceso a tu correo.'}
        </p>
        <p className="mb-8 text-sm" style={{ color: 'var(--color-bark-muted)' }}>
          Si no lo ves en unos minutos, revisa tu carpeta de spam o correo no deseado.
        </p>
        <Link href="/entrar" className="btn btn-secondary">
          Volver
        </Link>
      </div>
    </div>
  )
}
