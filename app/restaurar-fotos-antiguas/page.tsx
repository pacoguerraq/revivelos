import Link from 'next/link'
import { Ejemplos } from '@/components/landing/Ejemplos'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Accordion } from '@/components/ui/Accordion'
import { CameraIcon } from '@/components/icons/CameraIcon'
import { PaletteIcon } from '@/components/icons/PaletteIcon'
import { LockIcon } from '@/components/icons/LockIcon'

const description =
  'Restaura y coloriza fotos antiguas dañadas por manchas, rasgaduras o el paso del tiempo. Sube tu foto y recibe una vista previa gratis en un par de minutos.'

export const metadata = {
  title: 'Restaurar fotos antiguas',
  description,
  alternates: { canonical: '/restaurar-fotos-antiguas' },
  openGraph: { title: 'Restaurar fotos antiguas — Revívelos', description },
}

const DAÑOS = [
  {
    icon: <CameraIcon size={22} />,
    title: 'Rasgaduras y esquinas rotas',
    desc: 'Fotos que se doblaron, se rompieron o perdieron pedazos con los años.',
  },
  {
    icon: <PaletteIcon size={22} />,
    title: 'Manchas de humedad y decoloración',
    desc: 'Fotos guardadas en cajas o álbumes que amarillearon o se mancharon.',
  },
  {
    icon: <LockIcon size={22} />,
    title: 'Craquelado y pérdida de emulsión',
    desc: 'El daño típico de fotos muy viejas, donde la imagen se ve cuarteada o borrosa en partes.',
  },
]

const FAQ_ITEMS = [
  {
    question: '¿Qué tan dañada puede estar la foto?',
    answer:
      'Podemos trabajar con fotos con rasgaduras, manchas, decoloración y craquelado severo. Donde el daño destruyó información por completo, el sistema reconstruye esa zona basándose en lo que queda alrededor — no es magia, es una reconstrucción conservadora, igual que haría un restaurador humano sin conocer a la familia.',
  },
  {
    question: '¿El color que le pone es el color real de la ropa o los objetos?',
    answer:
      'Cuando la foto original es en blanco y negro, el color exacto de una prenda o un objeto no se puede saber con certeza — ni nosotros ni nadie puede adivinarlo con precisión. Usamos colores naturales y creíbles para la época, pero no garantizamos que sea el color exacto que tenía en la realidad.',
  },
  {
    question: '¿Cuánto tarda la restauración?',
    answer: 'Normalmente toma un par de minutos, entre subir la foto y ver el resultado en pantalla.',
  },
  {
    question: '¿Puedo probarlo gratis?',
    answer:
      'Sí. Tu primera restauración es gratis, en baja resolución y con marca de agua, para que veas la calidad antes de decidir si quieres la versión final en alta resolución.',
  },
]

export default function RestaurarFotosAntiguasPage() {
  return (
    <div className="py-14 sm:py-20">
      <div className="section-wrap">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p
            className="font-semibold uppercase mb-4"
            style={{ color: 'var(--color-amber-dark)', letterSpacing: '0.1em', fontSize: '0.8rem' }}
          >
            Restauración con inteligencia artificial
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
            Restaura y coloriza fotos antiguas de tu familia
          </h1>
          <p className="mb-8 leading-relaxed" style={{ fontSize: '1.05rem', color: 'var(--color-bark-muted)' }}>
            Arregla rasgaduras, manchas y decoloración, y agrega color natural a fotos en blanco y negro o
            sepia. Sube tu foto y mira el resultado en un par de minutos — la primera es gratis.
          </p>
          <Link href="/crear" className="btn btn-primary" style={{ fontSize: '1.1rem', minHeight: 60 }}>
            Restaura tu foto gratis
          </Link>
        </div>

        {/* Tipos de daño */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {DAÑOS.map((d) => (
            <div key={d.title} className="card p-6 text-center">
              <div className="mb-3 flex justify-center" style={{ color: 'var(--color-amber-dark)' }}>
                {d.icon}
              </div>
              <p className="font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
                {d.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-bark-muted)' }}>
                {d.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Ejemplos />

      <div className="section-wrap py-16 sm:py-20">
        <SectionHeading title="Preguntas frecuentes" className="mb-10" />
        <div className="max-w-2xl mx-auto">
          <Accordion items={FAQ_ITEMS} />
        </div>
      </div>

      <div className="section-wrap text-center pb-4">
        <Link href="/crear" className="btn btn-primary" style={{ fontSize: '1.05rem', minHeight: 58, padding: '0 36px' }}>
          Restaura tu foto gratis
        </Link>
      </div>
    </div>
  )
}
