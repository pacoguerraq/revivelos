import { SectionHeading } from '@/components/ui/SectionHeading'

const STEPS = [
  {
    number: '1',
    title: 'Sube tu foto',
    description:
      'Toma una foto con tu celular o elige una de tu galería. Funciona con fotos en blanco y negro, sepia, dañadas o desteñidas.',
  },
  {
    number: '2',
    title: 'Elige qué hacer',
    description:
      'Restaura y coloriza para obtener una foto de alta calidad, o anímala para crear un video corto donde la persona parece moverse.',
  },
  {
    number: '3',
    title: 'Descarga y comparte',
    description:
      'En un par de minutos tienes tu foto o video listo para descargar, imprimir o compartir con tu familia.',
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-16 sm:py-20">
      <div className="section-wrap">
        <SectionHeading
          title="Así de sencillo"
          subtitle="En tres pasos tienes tus recuerdos restaurados. Sin tecnicismos, sin complicaciones."
          className="mb-12"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              {/* Número */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-5 font-bold text-xl"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'var(--color-amber-50)',
                  border: '2px solid var(--color-sepia-200)',
                  color: 'var(--color-amber-dark)',
                }}
              >
                {step.number}
              </div>

              <h3
                className="font-semibold mb-2"
                style={{ fontSize: '1.05rem', color: 'var(--color-bark)' }}
              >
                {step.title}
              </h3>
              <p
                className="leading-relaxed"
                style={{ fontSize: '0.9rem', color: 'var(--color-bark-muted)', maxWidth: '24ch', margin: '0 auto' }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
