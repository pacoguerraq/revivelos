'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startCheckout } from '@/lib/checkout-client'

// Destino de callbackUrl cuando un usuario anónimo da clic en "Comprar":
// /entrar lo regresa aquí después de iniciar sesión, y esta página retoma
// el checkout automáticamente — sin que tenga que volver a buscar el
// paquete y dar clic otra vez. No pierde la intención de compra.
export function ComprarClient({ packageId }: { packageId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    startCheckout(packageId).then((outcome) => {
      if (cancelled) return
      if (outcome.needsAuth) {
        // No debería pasar (se llega aquí después de un login exitoso),
        // pero por si la sesión expiró justo en ese instante.
        router.push(`/entrar?callbackUrl=${encodeURIComponent(`/comprar/${packageId}`)}`)
        return
      }
      if (!outcome.ok) {
        setError(outcome.error ?? 'No se pudo iniciar el pago. Intenta de nuevo.')
      }
    })
    return () => {
      cancelled = true
    }
  }, [packageId, router])

  return (
    <div className="py-20 flex flex-col items-center text-center gap-4" style={{ minHeight: '50vh' }}>
      {error ? (
        <>
          <p style={{ color: 'var(--color-error)' }}>{error}</p>
          <Link href="/#precios" className="btn btn-secondary">
            Volver a precios
          </Link>
        </>
      ) : (
        <>
          <svg
            className="animate-spin"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Cargando"
            role="status"
            style={{ color: 'var(--color-amber)' }}
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p style={{ color: 'var(--color-bark-muted)' }}>Preparando tu compra…</p>
        </>
      )}
    </div>
  )
}
