import Link from 'next/link'
import { getUserId } from '@/lib/cookies'
import { getBalance } from '@/lib/credits'
import { CameraIcon } from '@/components/icons/CameraIcon'

export async function Header() {
  const userId = await getUserId()
  const balance = await getBalance(userId)

  // Estado real del badge
  const showFreeAvailable = !balance.freeUsed
  const showBuyLink = balance.freeUsed && balance.credits === 0
  const creditCount = balance.credits

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: 'rgba(250, 246, 240, 0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-sepia-100)',
      }}
    >
      <div
        className="section-wrap flex items-center justify-between gap-4"
        style={{ paddingTop: 18, paddingBottom: 18 }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
          style={{ textDecoration: 'none', color: 'var(--color-bark)' }}
          aria-label="Revívelos — Inicio"
        >
          <CameraIcon size={22} />
          <span
            className="font-bold leading-none"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}
          >
            Revívelos
          </span>
        </Link>

        {/* Nav derecha */}
        <nav className="flex items-center gap-3">
          {/* Badge de créditos — estado real */}
          {showBuyLink ? (
            <Link
              href="/#precios"
              className="text-sm font-semibold px-3 rounded-full"
              style={{
                paddingTop: 6,
                paddingBottom: 6,
                background: 'var(--color-sepia-100)',
                color: 'var(--color-amber-dark)',
                textDecoration: 'none',
              }}
            >
              Comprar créditos
            </Link>
          ) : (
            <span
              className="flex items-center gap-1.5 text-sm font-semibold px-3 rounded-full"
              style={{
                paddingTop: 6,
                paddingBottom: 6,
                background: showFreeAvailable ? 'var(--color-amber-50)' : 'var(--color-sepia-100)',
                color: showFreeAvailable ? 'var(--color-amber-dark)' : 'var(--color-bark-muted)',
              }}
              title={showFreeAvailable ? 'Tienes 1 restauración gratis disponible' : `${creditCount} créditos disponibles`}
            >
              <span aria-hidden>✦</span>
              {/* Mobile: solo el número/estado */}
              <span className="md:hidden">
                {showFreeAvailable ? '1' : creditCount}
              </span>
              {/* md+: texto completo */}
              <span className="hidden md:inline">
                {showFreeAvailable ? '1 gratis' : `${creditCount} crédito${creditCount !== 1 ? 's' : ''}`}
              </span>
            </span>
          )}

          {/* CTA secundario — no compite con el hero */}
          <Link
            href="/crear"
            className="btn btn-secondary"
            style={{ minHeight: 38, padding: '0 18px', fontSize: '0.875rem' }}
          >
            Revive una foto
          </Link>
        </nav>
      </div>
    </header>
  )
}
