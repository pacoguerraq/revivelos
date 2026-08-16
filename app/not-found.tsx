import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <div className="section-wrap" style={{ maxWidth: 480, margin: '0 auto' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '4rem',
            fontWeight: 600,
            color: 'var(--color-sepia-300)',
            lineHeight: 1,
          }}
        >
          404
        </p>
        <h1
          className="font-bold mt-4 mb-3"
          style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}
        >
          No encontramos esta página
        </h1>
        <p className="mb-8" style={{ color: 'var(--color-bark-muted)' }}>
          Puede que el enlace esté mal escrito o que la página ya no exista. Vamos de vuelta al inicio.
        </p>
        <Link href="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
