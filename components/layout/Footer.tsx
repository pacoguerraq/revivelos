import Link from 'next/link'
import { CameraIcon } from '@/components/icons/CameraIcon'

export function Footer() {
  return (
    <footer
      className="mt-20 py-10"
      style={{ borderTop: '1px solid var(--color-sepia-100)', background: 'var(--color-warm-white)' }}
    >
      <div className="section-wrap">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo y tagline */}
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              <span style={{ color: 'var(--color-bark-muted)' }}><CameraIcon size={18} /></span>
              <span
                className="font-bold text-lg"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-bark)' }}
              >
                Revívelos
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-bark-muted)' }}>
              Tus recuerdos, con vida nueva.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { href: '/crear', label: 'Revive una foto' },
              { href: '/#precios', label: 'Precios' },
              { href: '/#como-funciona', label: 'Cómo funciona' },
              { href: '/#preguntas', label: 'Preguntas frecuentes' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm"
                style={{ color: 'var(--color-bark-muted)', textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p
          className="text-center text-xs mt-8"
          style={{ color: 'var(--color-sepia-300)' }}
        >
          © {new Date().getFullYear()} Revívelos · Hecho con cariño en México
        </p>
      </div>
    </footer>
  )
}
