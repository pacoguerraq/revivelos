'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const POLL_INTERVAL_MS = 2_000
// Después de este tiempo dejamos de sondear, pero no tratamos la compra
// como fallida — Stripe puede tardar en entregar el webhook y el crédito
// va a aparecer solo. La fuente de verdad sigue siendo el webhook, nunca
// esta página.
const POLL_TIMEOUT_MS = 30_000

export function GraciasClient({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<'confirming' | 'confirmed' | 'delayed'>('confirming')
  const [creditsAdded, setCreditsAdded] = useState<number | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const startedAt = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    startedAt.current = Date.now()

    const poll = async () => {
      try {
        const res = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.confirmed) {
            if (cancelled) return
            // Saldo tal cual lo devuelve la DB en este momento — nunca se
            // suma nada en el cliente.
            setCreditsAdded(data.creditsAdded)
            setBalance(data.balance)
            setStatus('confirmed')
            // El saldo del Header (Server Component) necesita un refresh
            // para mostrar el crédito nuevo — mismo patrón que ProgressStages.
            router.refresh()
            return
          }
        }
      } catch {
        // silencioso, reintenta en el siguiente tick
      }

      if (cancelled) return
      if (Date.now() - (startedAt.current ?? Date.now()) > POLL_TIMEOUT_MS) {
        setStatus('delayed')
        return
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [sessionId, router])

  return (
    <div className="py-16 sm:py-24">
      <div className="section-wrap text-center" style={{ maxWidth: 480, margin: '0 auto' }}>
        {status === 'confirming' && (
          <>
            <svg
              className="animate-spin mx-auto mb-5"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              aria-label="Confirmando"
              role="status"
              style={{ color: 'var(--color-amber)' }}
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <h1
              className="font-bold mb-3"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}
            >
              Confirmando tu pago…
            </h1>
            <p style={{ color: 'var(--color-bark-muted)' }}>
              Esto toma solo un momento. No cierres esta pantalla.
            </p>
          </>
        )}

        {status === 'confirmed' && (
          <>
            <div className="mb-4 flex justify-center" style={{ color: 'var(--color-success)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                <path d="M7 12.5l3 3 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1
              className="font-bold mb-3"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}
            >
              ¡Gracias por tu compra!
            </h1>
            <p className="mb-6" style={{ color: 'var(--color-bark-muted)' }}>
              {creditsAdded != null && balance != null
                ? `Agregamos ${creditsAdded} crédito${creditsAdded !== 1 ? 's' : ''} a tu cuenta. Tu saldo ahora es de ${balance} crédito${balance !== 1 ? 's' : ''}.`
                : 'Tus créditos ya están en tu cuenta.'}
            </p>
            <Link href="/crear" className="btn btn-primary">
              Restaurar una foto ahora
            </Link>
          </>
        )}

        {status === 'delayed' && (
          <>
            <h1
              className="font-bold mb-3"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}
            >
              Tu pago se está procesando
            </h1>
            <p className="mb-6" style={{ color: 'var(--color-bark-muted)' }}>
              A veces la confirmación tarda un poco más de lo normal. Tus créditos aparecerán en tu cuenta en
              cuanto se confirme — no necesitas hacer nada más. Si en unos minutos no ves el saldo actualizado,
              escríbenos.
            </p>
            <Link href="/mis-fotos" className="btn btn-secondary">
              Ir a mi cuenta
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
