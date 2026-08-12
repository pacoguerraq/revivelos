import Link from 'next/link'
import { PackageCard } from '@/components/ui/PackageCard'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { PACKAGES } from '@/lib/pricing'

export function Pricing() {
  return (
    <section
      id="precios"
      className="py-16 sm:py-20"
      style={{ background: 'var(--color-warm-white)', borderTop: '1px solid var(--color-sepia-100)' }}
    >
      <div className="section-wrap">
        <SectionHeading
          title="Precios sencillos, sin sorpresas"
          subtitle="Compra créditos una sola vez. Sin suscripciones, sin cargos automáticos."
          className="mb-10"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {PACKAGES.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>

        {/* Beneficios universales — una sola vez, fuera de las tarjetas */}
        <p
          className="text-center text-sm mt-8"
          style={{ color: 'var(--color-bark-muted)', maxWidth: '56ch', margin: '2rem auto 0' }}
        >
          Todos los paquetes incluyen alta resolución sin marca de agua, descarga inmediata y créditos sin caducidad.
        </p>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--color-bark-muted)' }}>
          ¿Tienes dudas?{' '}
          <a href="#preguntas" style={{ color: 'var(--color-amber)', fontWeight: 600 }}>
            Preguntas frecuentes
          </a>
          {' '}·{' '}
          <Link href="/crear" style={{ color: 'var(--color-amber)', fontWeight: 600 }}>
            prueba gratis primero
          </Link>
        </p>
      </div>
    </section>
  )
}
