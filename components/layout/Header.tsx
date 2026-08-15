import Link from 'next/link'
import { getUserId } from '@/lib/cookies'
import { getBalance } from '@/lib/credits'
import { auth } from '@/lib/auth'
import { CameraIcon } from '@/components/icons/CameraIcon'
import { HeaderNav } from './HeaderNav'

export async function Header() {
  const [userId, session] = await Promise.all([getUserId(), auth()])
  const balance = await getBalance(userId)

  const navUser = session?.user
    ? { name: session.user.name ?? session.user.email ?? 'Tu cuenta' }
    : null

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
        className="section-wrap flex items-center justify-between gap-2 md:gap-4"
        style={{ paddingTop: 18, paddingBottom: 18 }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-1.5 md:gap-2 flex-shrink-0"
          style={{ textDecoration: 'none', color: 'var(--color-bark)' }}
          aria-label="Revívelos — Inicio"
        >
          <CameraIcon size={20} />
          <span
            className="font-bold leading-none"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(0.95rem, 4vw, 1.15rem)' }}
          >
            Revívelos
          </span>
        </Link>

        <HeaderNav freeUsed={balance.freeUsed} credits={balance.credits} user={navUser} />
      </div>
    </header>
  )
}
