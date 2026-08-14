import Image from 'next/image'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ArrowRightIcon } from '@/components/icons/ArrowRightIcon'

export function VideoEjemplo() {
  return (
    <section className="py-16 sm:py-20">
      <div className="section-wrap">
        <SectionHeading
          title="También puedes darle vida a tu foto"
          subtitle="Restauramos y coloreamos tu foto, y después la animamos en un video corto donde la persona parece cobrar vida."
          className="mb-12"
        />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
          <div className="flex flex-col items-center text-center" style={{ maxWidth: 380, width: '100%' }}>
            <div className="card overflow-hidden w-full" style={{ aspectRatio: '3/4', position: 'relative' }}>
              <Image
                src="/ejemplos/vid-old-photo.jpg"
                alt="Foto original dañada"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <h3 className="font-semibold mt-4 mb-1" style={{ fontSize: '1.05rem', color: 'var(--color-bark)' }}>
              Foto original
            </h3>
            <p
              className="leading-relaxed"
              style={{ fontSize: '0.9rem', color: 'var(--color-bark-muted)', maxWidth: '28ch', margin: '0 auto' }}
            >
              Dañada, en blanco y negro, con el tiempo encima.
            </p>
          </div>

          <span
            className="hidden sm:flex items-center justify-center shrink-0"
            style={{ color: 'var(--color-sepia-300)', marginTop: 160 }}
          >
            <ArrowRightIcon size={32} />
          </span>
          <span
            className="flex sm:hidden items-center justify-center shrink-0"
            style={{ color: 'var(--color-sepia-300)', transform: 'rotate(90deg)' }}
          >
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
              Animada en video
            </h3>
            <p
              className="leading-relaxed"
              style={{ fontSize: '0.9rem', color: 'var(--color-bark-muted)', maxWidth: '28ch', margin: '0 auto' }}
            >
              Restaurada, coloreada y animada en un video de 5 segundos donde parece cobrar vida.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
