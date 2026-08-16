import Link from 'next/link'
import Image from 'next/image'
import { PackageCard } from '@/components/ui/PackageCard'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { PACKAGES } from '@/lib/pricing'

// Logos de métodos de pago — vacío hasta que Stripe/Mercado Pago estén
// integrados de verdad (Fase 3). No anunciar un método que no funciona
// todavía; agregar aquí { name, src } cuando exista.
const PAYMENT_LOGOS: { name: string; src: string }[] = []

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
          <a href="#preguntas" style={{ color: 'var(--color-amber-dark)', fontWeight: 600 }}>
            Preguntas frecuentes
          </a>
          {' '}·{' '}
          <Link href="/crear" style={{ color: 'var(--color-amber-dark)', fontWeight: 600 }}>
            prueba gratis primero
          </Link>
        </p>

        {/* Garantía de reembolso — refleja exactamente lo que hace failJobAndRefund */}
        <p className="text-center text-xs mt-5" style={{ color: 'var(--color-sepia-300)' }}>
          Si una restauración o video falla por un error técnico, tu crédito se te devuelve automáticamente.{' '}
          <Link href="/reembolsos" style={{ color: 'var(--color-sepia-300)', textDecoration: 'underline' }}>
            Ver política de reembolsos
          </Link>
        </p>

        {PAYMENT_LOGOS.length > 0 && (
          <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
            {PAYMENT_LOGOS.map((logo) => (
              <Image key={logo.name} src={logo.src} alt={logo.name} width={80} height={24} style={{ height: 24, width: 'auto', opacity: 0.7 }} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
