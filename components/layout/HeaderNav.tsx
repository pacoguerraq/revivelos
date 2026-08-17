'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { MenuIcon } from '@/components/icons/MenuIcon'
import { CloseIcon } from '@/components/icons/CloseIcon'
import { CameraIcon } from '@/components/icons/CameraIcon'
import { LogOutIcon } from '@/components/icons/LogOutIcon'

const subscribeNoop = () => () => {}

// Detecta si ya estamos montados en el cliente (para el portal del drawer)
// sin disparar un setState dentro de un efecto.
function useMounted(): boolean {
  return useSyncExternalStore(subscribeNoop, () => true, () => false)
}

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

// Único punto de decisión de qué mostrar en el badge de saldo — nada más
// en el componente debe volver a decidir esto por su cuenta. Prioridad
// explícita, en este orden:
//   1. Créditos > 0 → mostrar el saldo. Quien ya compró no necesita que le
//      sigan ofreciendo la prueba gratis, aunque freeUsed siga en false
//      (p.ej. compró sin haber usado nunca su restauración gratuita).
//   2. Sin créditos y la gratis sigue disponible → "1 gratis".
//   3. Sin créditos y la gratis ya se usó → invitar a comprar.
type BadgeState = 'credits' | 'free' | 'buy'

function getBadgeState(freeUsed: boolean, credits: number): BadgeState {
  if (credits > 0) return 'credits'
  if (!freeUsed) return 'free'
  return 'buy'
}

function CreditsBadge({ freeUsed, credits, className = '' }: { freeUsed: boolean; credits: number; className?: string }) {
  const state = getBadgeState(freeUsed, credits)

  const content: Record<BadgeState, { label: string; mobileLabel: string; title: string; bg: string; color: string }> = {
    credits: {
      label: `${credits} crédito${credits !== 1 ? 's' : ''}`,
      mobileLabel: String(credits),
      title: `${credits} crédito${credits !== 1 ? 's' : ''} disponible${credits !== 1 ? 's' : ''}`,
      bg: 'var(--color-sepia-100)',
      color: 'var(--color-bark-muted)',
    },
    free: {
      label: '1 gratis',
      mobileLabel: '1',
      title: 'Tienes 1 restauración gratis disponible',
      bg: 'var(--color-amber-50)',
      color: 'var(--color-amber-dark)',
    },
    buy: {
      label: 'Comprar créditos',
      mobileLabel: 'Comprar',
      title: 'No te quedan créditos — compra para seguir restaurando fotos',
      bg: 'var(--color-amber-50)',
      color: 'var(--color-amber-dark)',
    },
  }
  const { label, mobileLabel, title, bg, color } = content[state]

  return (
    <Link
      href="/#precios"
      className={`flex items-center gap-1.5 text-sm font-semibold px-2.5 md:px-3 rounded-full whitespace-nowrap cursor-pointer transition-opacity duration-150 hover:opacity-80 ${className}`}
      style={{
        paddingTop: 6,
        paddingBottom: 6,
        background: bg,
        color,
        textDecoration: 'none',
      }}
      title={title}
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

function LoginButton({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/entrar"
      className={`btn btn-secondary whitespace-nowrap ${className}`}
      style={{ minHeight: 38, padding: '0 clamp(12px, 4vw, 18px)', fontSize: '0.875rem' }}
    >
      Ingresar
    </Link>
  )
}

// Cierra sesión y fuerza que el Header (Server Component) se vuelva a
// renderizar con el estado nuevo — signOut() de next-auth/react hace
// `window.location.href = url`, que en teoría ya recarga la página, pero
// depender de eso deja el saldo del navbar a merced de si el navegador
// decide que navegar a la misma URL amerita una recarga real. router.push +
// router.refresh es el mismo patrón que ya usa el resto de la app
// (PhotoUploader, ProgressStages) y no depende de ese detalle.
async function handleSignOut(router: ReturnType<typeof useRouter>) {
  await signOut({ redirect: false })
  router.push('/')
  router.refresh()
}

// Avatar + menú desplegable (solo desktop) con acceso a la galería y salir.
function AccountMenu({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative hidden md:block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center rounded-full cursor-pointer transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
        style={{ padding: 3 }}
        aria-label="Cuenta"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar user={user} />
      </button>

      {/* Siempre montado (no solo cuando open) para poder animar la salida,
          no solo la entrada. */}
      <div
        role="menu"
        className="absolute right-0 mt-2 rounded-xl overflow-hidden transition-all duration-150"
        style={{
          minWidth: 200,
          maxWidth: 240,
          background: 'var(--color-warm-white)',
          border: '1px solid var(--color-sepia-100)',
          boxShadow: 'var(--shadow-warm-lg)',
          zIndex: 70,
          transformOrigin: 'top right',
          opacity: open ? 1 : 0,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(-6px)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--color-sepia-100)' }}>
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-bark)' }}>{user.name}</p>
        </div>
        <Link
          href="/mis-fotos"
          onClick={() => setOpen(false)}
          role="menuitem"
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
          style={{ color: 'var(--color-bark)', textDecoration: 'none' }}
        >
          <CameraIcon size={16} />
          Mis fotos
        </Link>
        <button
          type="button"
          role="menuitem"
          onClick={() => { setOpen(false); handleSignOut(router) }}
          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
          style={{ color: 'var(--color-error)' }}
        >
          <LogOutIcon size={16} />
          Salir
        </button>
      </div>
    </div>
  )
}

export function HeaderNav({ freeUsed, credits, user }: HeaderNavProps) {
  const router = useRouter()
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

        {user ? (
          <AccountMenu user={user} />
        ) : (
          // .btn trae su propio display:inline-flex fuera de cualquier
          // @layer, así que le gana en cascada a la utilidad `hidden` de
          // Tailwind si se pone directo en el botón — hay que envolverlo en
          // un div sin esa clase para que el ocultamiento funcione.
          <div className="hidden md:block">
            <LoginButton />
          </div>
        )}
        {user && (
          <Link
            href="/mis-fotos"
            className="md:hidden flex items-center justify-center rounded-full cursor-pointer transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
            style={{ padding: 3 }}
            aria-label="Mis fotos"
          >
            <Avatar user={user} size={34} />
          </Link>
        )}
        {!user && (
          <div className="md:hidden">
            <LoginButton />
          </div>
        )}

        {/* Hamburguesa — solo móvil */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="md:hidden flex items-center justify-center rounded-full cursor-pointer transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
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
                className="flex items-center justify-center rounded-full cursor-pointer transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
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
                className="px-3 py-3 rounded-lg font-semibold cursor-pointer transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
                style={{ color: 'var(--color-bark)', textDecoration: 'none' }}
              >
                Comprar créditos
              </Link>
              <Link
                href="/crear"
                onClick={() => setDrawerOpen(false)}
                className="px-3 py-3 rounded-lg font-semibold cursor-pointer transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
                style={{ color: 'var(--color-bark)', textDecoration: 'none' }}
              >
                Subir foto
              </Link>
              {user && (
                <Link
                  href="/mis-fotos"
                  onClick={() => setDrawerOpen(false)}
                  className="px-3 py-3 rounded-lg font-semibold cursor-pointer transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
                  style={{ color: 'var(--color-bark)', textDecoration: 'none' }}
                >
                  Mis fotos
                </Link>
              )}
            </nav>

            <div className="mt-auto p-5" style={{ borderTop: '1px solid var(--color-sepia-100)' }}>
              {user ? (
                <div className="flex items-center gap-3">
                  <Avatar user={user} size={34} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight truncate">{user.name}</p>
                    <button
                      type="button"
                      onClick={() => { setDrawerOpen(false); handleSignOut(router) }}
                      className="flex items-center gap-1.5 text-sm font-semibold mt-1 -ml-1 px-1 py-0.5 rounded cursor-pointer transition-colors duration-150 hover:bg-[var(--color-sepia-100)]"
                      style={{ color: 'var(--color-error)' }}
                    >
                      <LogOutIcon size={15} />
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
