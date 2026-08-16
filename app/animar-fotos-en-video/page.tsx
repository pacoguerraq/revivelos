import Link from 'next/link'
import Image from 'next/image'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Accordion } from '@/components/ui/Accordion'
import { ArrowRightIcon } from '@/components/icons/ArrowRightIcon'

const description =
  'Anima fotos antiguas de tu familia en un video corto donde la persona parpadea, respira y sonríe suavemente. Funciona mejor con una o dos personas y rostros grandes.'

export const metadata = {
  title: 'Animar fotos en video',
  description,
  alternates: { canonical: '/animar-fotos-en-video' },
  openGraph: { title: 'Animar fotos en video — Revívelos', description },
}

const FAQ_ITEMS = [
  {
    question: '¿Con qué fotos funciona mejor la animación?',
    answer:
      'Funciona mejor con fotos de una o dos personas, con el rostro grande y de frente a la cámara. Con grupos grandes el resultado también se genera, pero el movimiento de tantas personas a la vez se ve menos natural — es una limitación real del proceso, no un defecto que vayamos a corregir con un mejor prompt.',
  },
  {
    question: '¿La foto se anima directo, sin restaurarla antes?',
    answer:
      'No — primero se restaura y coloriza la foto, y esa versión ya arreglada es la que se anima. Si se animara la foto dañada, el video terminaría animando también las grietas y manchas.',
  },
  {
    question: '¿Cuánto dura el video y cuánto tarda en generarse?',
    answer:
      'El video dura unos segundos, en un loop suave. Generarlo toma más tiempo que una restauración normal — puede tardar más de un minuto, porque el movimiento se calcula cuadro por cuadro.',
  },
  {
    question: '¿Cuesta lo mismo que restaurar una foto?',
    answer:
      'No, cuesta más créditos porque el proceso es más pesado: primero se restaura la foto y después se anima. El costo exacto se muestra antes de confirmar, sin sorpresas.',
  },
]

export default function AnimarFotosEnVideoPage() {
  return (
    <div className="py-14 sm:py-20">
      <div className="section-wrap">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p
            className="font-semibold uppercase mb-4"
            style={{ color: 'var(--color-amber-dark)', letterSpacing: '0.1em', fontSize: '0.8rem' }}
          >
            Animación con inteligencia artificial
          </p>
          <h1
            className="font-bold mb-5"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 2.75rem)',
              lineHeight: 1.15,
              color: 'var(--color-bark)',
            }}
          >
            Anima fotos antiguas y dales vida en video
          </h1>
          <p className="mb-8 leading-relaxed" style={{ fontSize: '1.05rem', color: 'var(--color-bark-muted)' }}>
            Restauramos tu foto y después la convertimos en un video corto donde la persona parpadea,
            respira y sonríe suavemente — sin gestos exagerados, sin que hable, con la cámara siempre quieta.
          </p>
          <Link href="/crear" className="btn btn-primary" style={{ fontSize: '1.1rem', minHeight: 60 }}>
            Anima tu foto
          </Link>
        </div>

        {/* Antes / después animado */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 mb-16">
          <div className="flex flex-col items-center text-center" style={{ maxWidth: 380, width: '100%' }}>
            <div className="card overflow-hidden w-full" style={{ aspectRatio: '3/4', position: 'relative' }}>
              <Image src="/ejemplos/vid-old-photo.jpg" alt="Foto original dañada, antes de restaurarla y animarla" fill style={{ objectFit: 'cover' }} />
            </div>
            <h3 className="font-semibold mt-4 mb-1" style={{ fontSize: '1.05rem', color: 'var(--color-bark)' }}>
              Foto original
            </h3>
          </div>

          <span className="hidden sm:flex items-center justify-center shrink-0" style={{ color: 'var(--color-sepia-300)', marginTop: 80 }}>
            <ArrowRightIcon size={32} />
          </span>
          <span className="flex sm:hidden items-center justify-center shrink-0" style={{ color: 'var(--color-sepia-300)', transform: 'rotate(90deg)' }}>
            <ArrowRightIcon size={28} />
          </span>

          <div className="flex flex-col items-center text-center" style={{ maxWidth: 380, width: '100%' }}>
            <div className="card overflow-hidden w-full" style={{ aspectRatio: '3/4', position: 'relative' }}>
              <video
                src="/ejemplos/video-animated.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <h3 className="font-semibold mt-4 mb-1" style={{ fontSize: '1.05rem', color: 'var(--color-bark)' }}>
              Restaurada y animada
            </h3>
          </div>
        </div>

        {/* Limitación honesta */}
        <div className="card p-6 max-w-2xl mx-auto mb-16 text-center" style={{ border: '1px solid var(--color-sepia-200)', background: 'var(--color-amber-50)' }}>
          <p className="font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Funciona mejor con una o dos personas
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-bark-muted)' }}>
            La animación se ve mejor con fotos de una o dos personas con el rostro grande y de frente a la
            cámara. Con fotos de grupos grandes también genera un resultado, pero el movimiento de tantas
            personas a la vez se ve menos natural. Te lo decimos antes de que gastes tus créditos.
          </p>
        </div>
      </div>

      <div className="section-wrap py-4">
        <SectionHeading title="Preguntas frecuentes" className="mb-10" />
        <div className="max-w-2xl mx-auto">
          <Accordion items={FAQ_ITEMS} />
        </div>
      </div>

      <div className="section-wrap text-center pt-8">
        <Link href="/crear" className="btn btn-primary" style={{ fontSize: '1.05rem', minHeight: 58, padding: '0 36px' }}>
          Anima tu foto
        </Link>
      </div>
    </div>
  )
}
