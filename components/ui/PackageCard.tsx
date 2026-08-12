import { type Package, calcEquivalencias } from '@/lib/pricing'

export function PackageCard({ pkg }: { pkg: Package }) {
  const { restores, videos } = calcEquivalencias(pkg.credits)

  // Pluralización correcta: sin concatenar sufijos sobre palabras con tilde
  const restoresLabel = restores === 1 ? '1 restauración' : `${restores} restauraciones`
  const videosLabel = videos === 1 ? '1 video' : `${videos} videos`

  return (
    <div
      className="card p-6 flex flex-col relative"
      style={{ border: pkg.popular ? '2px solid var(--color-amber)' : undefined }}
    >
      {pkg.popular && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full text-white whitespace-nowrap"
          style={{ background: 'var(--color-amber)' }}
        >
          Más popular
        </span>
      )}

      {/* Nombre y precio */}
      <div className="mb-4">
        <h3
          className="font-semibold mb-2"
          style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--color-bark)' }}
        >
          {pkg.name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span
            className="font-bold"
            style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--color-bark)' }}
          >
            ${pkg.price}
          </span>
          <span className="text-sm" style={{ color: 'var(--color-bark-muted)' }}>MXN</span>
        </div>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-bark-muted)' }}>
          {pkg.credits} créditos · ${Math.round(pkg.price / pkg.credits)} por crédito
        </p>
      </div>

      {/* Equivalencia — una línea, sin caja, sin "o cualquier combinación" */}
      <p
        className="text-sm font-semibold mb-5 pb-4"
        style={{
          color: 'var(--color-bark)',
          borderBottom: '1px solid var(--color-sepia-100)',
        }}
      >
        {restoresLabel} o {videosLabel} animados
      </p>

      {/* Único diferenciador por plan */}
      <ul className="mb-6 flex-1">
        {pkg.credits >= 15 && (
          <li className="flex items-start gap-2 text-sm">
            <span style={{ color: 'var(--color-success)', flexShrink: 0 }}>✓</span>
            <span style={{ color: 'var(--color-bark-muted)' }}>Soporte por WhatsApp</span>
          </li>
        )}
      </ul>

      {/* TODO: integrar Stripe — conectar este botón con el checkout */}
      <button
        type="button"
        className={pkg.popular ? 'btn btn-primary w-full' : 'btn btn-secondary w-full'}
      >
        Comprar {pkg.credits} créditos
      </button>
    </div>
  )
}
