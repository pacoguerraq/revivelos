import { EJEMPLOS } from '@/lib/ejemplos'
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider'
import { SectionHeading } from '@/components/ui/SectionHeading'

export function Ejemplos() {
  return (
    <section
      className="py-16 sm:py-20"
      style={{
        background: 'var(--color-warm-white)',
        borderTop: '1px solid var(--color-sepia-100)',
        borderBottom: '1px solid var(--color-sepia-100)',
      }}
    >
      <div className="section-wrap">
        <SectionHeading
          title="Ejemplos de restauraciones reales"
          subtitle="Arrastra la línea para ver la diferencia."
          className="mb-10"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {EJEMPLOS.map((ejemplo) => (
            <div key={ejemplo.id} className="card overflow-hidden">
              <BeforeAfterSlider
                beforeSrc={ejemplo.beforeSrc}
                afterSrc={ejemplo.afterSrc}
                beforeLabel="Original"
                afterLabel="Restaurada"
                aspectRatio="4/3"
              />
              <div className="p-4">
                <p
                  className="font-semibold"
                  style={{ fontSize: '0.9rem', color: 'var(--color-bark)' }}
                >
                  {ejemplo.titulo}
                </p>
                <p
                  className="mt-1 leading-snug"
                  style={{ fontSize: '0.8rem', color: 'var(--color-bark-muted)' }}
                >
                  {ejemplo.descripcion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
