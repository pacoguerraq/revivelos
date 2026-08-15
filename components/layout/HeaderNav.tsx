'use client'

import Link from 'next/link'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { MenuIcon } from '@/components/icons/MenuIcon'
import { CloseIcon } from '@/components/icons/CloseIcon'

const subscribeNoop = () => () => {}

// Detecta si ya estamos montados en el cliente (para el portal del drawer)
// sin disparar un setState dentro de un efecto.
function useMounted(): boolean {
  return useSyncExternalStore(subscribeNoop, () => true, () => false)
}

// Sin auth implementada todavía — cuando exista, pasar el usuario real de la
// sesión en vez de `null`. El resto del componente ya sabe renderizar el
// avatar cuando `user` no es null.
export interface NavUser {
  name: string
}

interface HeaderNavProps {
  freeUsed: boolean
  credits: number
  user: NavUser | null
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function CreditsBadge({ freeUsed, credits, className = '' }: { freeUsed: boolean; credits: number; className?: string }) {
  const showFreeAvailable = !freeUsed
  const label = showFreeAvailable ? '1 gratis' : `${credits} crédito${credits !== 1 ? 's' : ''}`
  const mobileLabel = showFreeAvailable ? '1' : String(credits)

  return (
    <Link
      href="/#precios"
      className={`flex items-center gap-1.5 text-sm font-semibold px-2.5 md:px-3 rounded-full whitespace-nowrap ${className}`}
      style={{
        paddingTop: 6,
        paddingBottom: 6,
        background: showFreeAvailable ? 'var(--color-amber-50)' : 'var(--color-sepia-100)',
        color: showFreeAvailable ? 'var(--color-amber-dark)' : 'var(--color-bark-muted)',
        textDecoration: 'none',
      }}
      title={showFreeAvailable ? 'Tienes 1 restauración gratis disponible' : `${credits} crédito${credits !== 1 ? 's' : ''} disponible${credits !== 1 ? 's' : ''}`}
    >
      <span aria-hidden>✦</span>
      <span className="md:hidden">{mobileLabel}</span>
      <span className="hidden md:inline">{label}</span>
    </Link>
  )
}

function Avatar({ user, size = 38 }: { user: NavUser; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: 'var(--color-amber)',
        color: '#fff',
        fontSize: size * 0.4,
      }}
      title={user.name}
      aria-label={`Cuenta de ${user.name}`}
    >
      {getInitials(user.name)}
    </div>
  )
}

// Botón "Ingresar" sin funcionalidad todavía — placeholder hasta que exista
// login/registro real.
function LoginButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      className={`btn btn-secondary whitespace-nowrap ${className}`}
      style={{ minHeight: 38, padding: '0 clamp(12px, 4vw, 18px)', fontSize: '0.875rem' }}
    >
      Ingresar
    </button>
  )
}

export function HeaderNav({ freeUsed, credits, user }: HeaderNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  // El drawer se porta a document.body: el <header> tiene backdrop-filter,
  // que crea un containing block nuevo y rompe `position: fixed` de los
  // descendientes (queda anclado al alto del navbar en vez del viewport).
  const mounted = useMounted()

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <nav className="flex items-center gap-1.5 md:gap-3">
        <CreditsBadge freeUsed={freeUsed} credits={credits} />

        {user ? <Avatar user={user} /> : <LoginButton />}

        {/* Hamburguesa — solo móvil */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="md:hidden flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
          style={{ width: 38, height: 38, color: 'var(--color-bark)' }}
          aria-label="Abrir menú"
          aria-expanded={drawerOpen}
        >
          <MenuIcon size={22} />
        </button>
      </nav>

      {mounted && createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 md:hidden transition-opacity duration-200"
            style={{
              background: 'rgba(61, 43, 31, 0.4)',
              zIndex: 60,
              opacity: drawerOpen ? 1 : 0,
              pointerEvents: drawerOpen ? 'auto' : 'none',
            }}
            onClick={() => setDrawerOpen(false)}
            aria-hidden={!drawerOpen}
          />

          {/* Drawer */}
          <div
            className="fixed top-0 right-0 h-full md:hidden flex flex-col transition-transform duration-200"
            style={{
              width: 'min(84vw, 320px)',
              background: 'var(--color-warm-white)',
              boxShadow: 'var(--shadow-warm-lg)',
              zIndex: 61,
              transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
          >
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--color-sepia-100)' }}>
              <span className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
                Menú
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
                style={{ width: 36, height: 36, color: 'var(--color-bark-muted)' }}
                aria-label="Cerrar menú"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <nav className="flex flex-col p-3">
              <Link
                href="/#precios"
                onClick={() => setDrawerOpen(false)}
                className="px-3 py-3 rounded-lg font-semibold transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
                style={{ color: 'var(--color-bark)', textDecoration: 'none' }}
              >
                Comprar créditos
              </Link>
              <Link
                href="/crear"
                onClick={() => setDrawerOpen(false)}
                className="px-3 py-3 rounded-lg font-semibold transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
                style={{ color: 'var(--color-bark)', textDecoration: 'none' }}
              >
                Subir foto
              </Link>
            </nav>

            <div className="mt-auto p-5" style={{ borderTop: '1px solid var(--color-sepia-100)' }}>
              {user ? (
                <div className="flex items-center gap-3">
                  <Avatar user={user} size={34} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-tight">{user.name}</p>
                    <button
                      type="button"
                      className="text-sm"
                      style={{ color: 'var(--color-bark-muted)', textDecoration: 'underline' }}
                    >
                      Salir
                    </button>
                  </div>
                </div>
              ) : (
                <LoginButton className="w-full" />
              )}
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  )
}
