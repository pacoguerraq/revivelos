import Link from 'next/link'
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider'

// Pon las imágenes en /public/ejemplos/
// El slider mostrará el fallback "Imagen pendiente" hasta que existan
const HERO_BEFORE = '/ejemplos/hero-antes.jpg'
const HERO_AFTER = '/ejemplos/hero-despues.jpg'

export function Hero() {
  return (
    <section
      className="relative overflow-hidden py-12 sm:py-20"
      style={{ background: 'linear-gradient(180deg, var(--color-amber-50) 0%, var(--color-cream) 100%)' }}
    >
      <div className="section-wrap">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Texto */}
          <div className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            <p
              className="font-semibold uppercase mb-4"
              style={{ color: 'var(--color-amber)', letterSpacing: '0.1em', fontSize: '0.8rem' }}
            >
              Restauración con inteligencia artificial
            </p>

            <h1
              className="font-bold mb-5"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                lineHeight: 1.15,
                color: 'var(--color-bark)',
              }}
            >
              Dale vida nueva a las fotos de tu familia
            </h1>

            <p
              className="mb-8 leading-relaxed"
              style={{ fontSize: '1.05rem', color: 'var(--color-bark-muted)', maxWidth: 440 }}
            >
              Restauramos, colorizamos y animamos fotos viejas, dañadas o en blanco y negro.
              La primera foto es{' '}
              <strong style={{ color: 'var(--color-bark)' }}>completamente gratis</strong>,
              sin necesidad de crear una cuenta.
            </p>

            <Link
              href="/crear"
              className="btn btn-primary"
              style={{ fontSize: '1.1rem', minHeight: 60 }}
            >
              Revive tu foto gratis
            </Link>

            <p className="mt-4" style={{ fontSize: '0.8rem', color: 'var(--color-sepia-300)' }}>
              Sin registro · Sin tarjeta · Resultado en un par de minutos
            </p>
          </div>

          {/* Slider de demostración */}
          <div className="flex-1 w-full max-w-md lg:max-w-none">
            <div
              className="rounded-xl overflow-hidden"
              style={{ boxShadow: 'var(--shadow-warm-lg)', border: '1px solid var(--color-sepia-100)' }}
            >
              <BeforeAfterSlider
                beforeSrc={HERO_BEFORE}
                afterSrc={HERO_AFTER}
                beforeLabel="Antes"
                afterLabel="Después"
                aspectRatio="4/3"
              />
            </div>
            <p className="text-center mt-3" style={{ fontSize: '0.75rem', color: 'var(--color-sepia-300)' }}>
              Arrastra la línea para comparar
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
