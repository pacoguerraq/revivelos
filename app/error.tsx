'use client'

import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="py-20 text-center">
      <div className="section-wrap" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1
          className="font-bold mb-3"
          style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}
        >
          Algo salió mal
        </h1>
        <p className="mb-8" style={{ color: 'var(--color-bark-muted)' }}>
          Tuvimos un problema inesperado. No se te cobró nada. Intenta de nuevo en un momento.
        </p>
        <button onClick={reset} className="btn btn-primary">
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
