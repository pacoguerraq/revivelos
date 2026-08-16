'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const HIDDEN_PREFIXES = ['/crear', '/procesando', '/resultado']

export function StickyMobileCta() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Aproxima "ya pasaste el hero": el hero mide más que la pantalla en
    // casi cualquier celular, así que un umbral fijo generoso evita medir
    // el DOM de cada página (no todas tienen un Hero como primer bloque).
    const threshold = Math.round(window.innerHeight * 0.7)
    const onScroll = () => setVisible(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null

  return (
    <div
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3"
      style={{
        background: 'var(--color-warm-white)',
        borderTop: '1px solid var(--color-sepia-100)',
        boxShadow: '0 -4px 16px rgba(61, 43, 31, 0.08)',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 200ms ease',
      }}
    >
      <Link href="/crear" className="btn btn-primary w-full" style={{ fontSize: '1rem' }}>
        Revive tu foto gratis
      </Link>
    </div>
  )
}
