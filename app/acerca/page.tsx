import Link from 'next/link'

const description =
  'Por qué existe Revívelos: un servicio para restaurar y animar fotos antiguas de familia, hecho por una sola persona en México.'

export const metadata = {
  title: 'Acerca de Revívelos',
  description,
  alternates: { canonical: '/acerca' },
  openGraph: { title: 'Acerca de Revívelos — Revívelos', description },
}

export default function AcercaPage() {
  return (
    <div className="py-14 sm:py-20">
      <div className="section-wrap" style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1
          className="font-bold mb-8"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: 'var(--color-bark)' }}
        >
          Por qué existe Revívelos
        </h1>

        <div style={{ color: 'var(--color-bark)', lineHeight: 1.8, fontSize: '1rem' }} className="flex flex-col gap-5">
          <p>
            Revívelos lo hice yo, una sola persona, no un equipo ni una empresa grande. La idea nació de algo
            simple: en casi todas las familias hay fotos viejas guardadas en una caja o un álbum — manchadas,
            rotas, descoloridas — de personas que muchas veces ya no están. Restaurarlas a mano, con Photoshop
            y paciencia, es un trabajo que toma horas por foto. La inteligencia artificial hoy puede hacer una
            versión muy buena de ese trabajo en minutos, y me pareció que valía la pena ponerla al alcance de
            cualquiera, no solo de quien sabe usar software de edición.
          </p>
          <p>
            Elegí los modelos de IA que uso después de probarlos a mano contra fotos reales de distinta
            gravedad de daño — retratos individuales, fotos con craquelado severo, fotos de grupos grandes —
            y me quedé con los que dieron mejores resultados sin inventar de más. Sigo ajustando esas
            decisiones conforme aprendo qué funciona y qué no.
          </p>
          <p>
            Soy honesto sobre las limitaciones: donde el daño de una foto destruyó información por completo,
            el sistema tiene que adivinar esa parte, igual que lo haría un restaurador humano que no conoció
            a la familia. Y la animación en video se ve mejor con una o dos personas que con fotos de grupos
            grandes. Prefiero decir esto claramente antes de que gastes un crédito, no después.
          </p>
          <p>
            Si tienes una duda, una queja o simplemente quieres contarme cómo te fue con tu foto, escríbeme
            directo a{' '}
            <a href="mailto:contacto.revivelos@gmail.com" style={{ color: 'var(--color-amber-dark)', fontWeight: 600 }}>
              contacto.revivelos@gmail.com
            </a>
            . Lo leo yo, no un equipo de soporte.
          </p>
        </div>

        <div className="mt-10">
          <Link href="/crear" className="btn btn-primary">
            Prueba tu primera foto gratis
          </Link>
        </div>
      </div>
    </div>
  )
}
