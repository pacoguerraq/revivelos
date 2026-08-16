'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="es">
      <body style={{ background: '#FAF6F0', color: '#3D2B1F', fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Algo salió mal
            </h1>
            <p style={{ color: '#7A5C45', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              Tuvimos un problema inesperado cargando el sitio. No se te cobró nada. Intenta de nuevo en un momento.
            </p>
            <button
              onClick={reset}
              style={{
                background: '#A8640A',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.9rem 1.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
