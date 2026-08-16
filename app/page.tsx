import { Hero } from '@/components/landing/Hero'
import { Ejemplos } from '@/components/landing/Ejemplos'
import { VideoEjemplo } from '@/components/landing/VideoEjemplo'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Pricing } from '@/components/landing/Pricing'
import { FAQ } from '@/components/landing/FAQ'
import { JsonLd } from '@/components/JsonLd'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      <JsonLd />
      <Hero />

      <p className="text-center text-sm py-2" style={{ color: 'var(--color-bark-muted)' }}>
        Conoce más sobre{' '}
        <Link href="/restaurar-fotos-antiguas" style={{ color: 'var(--color-amber-dark)', fontWeight: 600 }}>
          restaurar fotos antiguas
        </Link>{' '}
        o{' '}
        <Link href="/animar-fotos-en-video" style={{ color: 'var(--color-amber-dark)', fontWeight: 600 }}>
          animar fotos en video
        </Link>
        .
      </p>

      <Ejemplos />
      <VideoEjemplo />
      <HowItWorks />
      <Pricing />
      <FAQ />

      {/* CTA final */}
      <section
        className="py-14 text-center"
        style={{ background: 'linear-gradient(180deg, var(--color-amber-50) 0%, var(--color-cream) 100%)' }}
      >
        <div className="section-wrap" style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 600,
              color: 'var(--color-bark)',
              marginBottom: '0.75rem',
            }}
          >
            ¿Tienes una foto esperando ser revivida?
          </h2>
          <p className="mb-7" style={{ color: 'var(--color-bark-muted)', fontSize: '1rem' }}>
            La primera foto es completamente gratis. Sin registro, sin tarjeta.
          </p>
          <Link
            href="/crear"
            className="btn btn-primary"
            style={{ fontSize: '1.05rem', minHeight: 58, padding: '0 36px' }}
          >
            Revive tu foto gratis
          </Link>
        </div>
      </section>
    </>
  )
}
