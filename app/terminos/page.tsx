/**
 * BORRADOR — este texto lo redactó un agente de IA. NO está revisado por
 * un abogado. Debe pasar por revisión legal antes de usarse en producción
 * o de empezar a cobrar.
 */
import { LegalPage, LegalList } from '@/components/legal/LegalPage'

const description =
  'Condiciones de uso de Revívelos: cómo funcionan los créditos, qué esperar de los resultados generados por IA y responsabilidades del usuario y del servicio.'

export const metadata = {
  title: 'Términos y condiciones',
  description,
  alternates: { canonical: '/terminos' },
  openGraph: { title: 'Términos y condiciones — Revívelos', description },
}

export default function TerminosPage() {
  return (
    <LegalPage
      title="Términos y condiciones"
      updated="15 de agosto de 2026"
      intro="Al usar Revívelos aceptas estos términos. Los escribimos en español claro a propósito — si algo no te queda claro, escríbenos antes de comprar créditos."
      sections={[
        {
          heading: '1. Qué es Revívelos',
          body: (
            <p>
              Revívelos es un servicio en línea que restaura, colorea y anima fotografías antiguas usando
              inteligencia artificial. Funciona con créditos de pago único: no hay suscripciones ni cargos
              automáticos. Puedes probar una restauración gratis sin crear cuenta.
            </p>
          ),
        },
        {
          heading: '2. Cuentas',
          body: (
            <p>
              No necesitas cuenta para probar el servicio gratis. Si quieres comprar créditos o guardar tu
              galería, puedes crear una cuenta con tu correo (sin contraseña, te enviamos un enlace de acceso) o
              con tu cuenta de Google. Eres responsable de mantener el acceso a tu correo o cuenta de Google
              seguro, ya que es la forma en que entras a Revívelos.
            </p>
          ),
        },
        {
          heading: '3. Créditos',
          body: (
            <LegalList>
              <li>Los créditos se compran una sola vez y no caducan.</li>
              <li>Los créditos no son transferibles a otra cuenta ni canjeables por dinero, salvo lo indicado en nuestra Política de reembolsos.</li>
              <li>Una restauración cuesta 1 crédito; un video animado cuesta 3 créditos.</li>
              <li>
                Tienes derecho a una vista previa gratuita (en baja resolución y con marca de agua) por persona,
                verificada por correo y por dispositivo — no por cada cuenta que crees.
              </li>
              <li>
                Si una generación falla por un error de nuestro sistema o del proveedor de IA, el crédito se
                reembolsa automáticamente a tu saldo. No necesitas pedirlo.
              </li>
            </LegalList>
          ),
        },
        {
          heading: '4. Resultados generados por inteligencia artificial',
          body: (
            <>
              <p>
                Los resultados los genera un modelo de inteligencia artificial, no una persona. Esto significa:
              </p>
              <LegalList>
                <li>
                  Donde el daño de la foto original destruyó información (una rasgadura, una mancha grande), la
                  IA reconstruye esa zona de forma razonable pero no puede garantizar que sea exactamente como
                  era la foto original — ni un restaurador humano podría, sin conocer a las personas de la foto.
                </li>
                <li>
                  El color de una prenda o un objeto que en la foto original es blanco y negro es una decisión
                  del modelo, no un dato recuperado: dos restauraciones de la misma foto pueden dar colores
                  distintos.
                </li>
                <li>
                  Los videos animados funcionan mejor con fotos de una o dos personas con el rostro grande y de
                  frente. Con fotos grupales o de perfil, el resultado puede verse menos natural.
                </li>
              </LegalList>
              <p style={{ marginTop: '0.75rem' }}>
                No garantizamos que el resultado cumpla con una expectativa artística o histórica específica.
                Antes de gastar un crédito, siempre puedes ver la vista previa gratuita del resultado.
              </p>
            </>
          ),
        },
        {
          heading: '5. Tus fotos y tus derechos sobre ellas',
          body: (
            <p>
              Al subir una foto a Revívelos, declaras que tienes derecho a hacerlo — porque es tuya, porque es de
              tu familia, o porque tienes autorización de quien la tomó o de las personas que aparecen en ella.
              No subas fotos de terceros sin su permiso, ni contenido que no sean fotografías familiares o
              personales legítimas. El resultado generado a partir de tu foto es tuyo: puedes descargarlo,
              imprimirlo y compartirlo libremente.
            </p>
          ),
        },
        {
          heading: '5.1. Solicitudes de retiro de contenido',
          body: (
            <p>
              Si crees que una foto subida a Revívelos usa contenido tuyo sin tu autorización, escríbenos a{' '}
              <a href="mailto:franciscoguerraquintanilla@gmail.com" style={{ color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                franciscoguerraquintanilla@gmail.com
              </a>{' '}
              describiendo la foto y por qué consideras que se subió sin permiso. Revisamos cada solicitud caso
              por caso y, si procede, eliminamos la foto y su resultado de nuestros servidores.
            </p>
          ),
        },
        {
          heading: '6. Uso aceptable',
          body: (
            <p>
              No está permitido usar Revívelos para procesar contenido ilegal, ofensivo, que infrinja derechos de
              terceros, o para intentar abusar de la restauración gratuita (por ejemplo, creando cuentas
              múltiples para evitar el límite de una gratis por persona). Nos reservamos el derecho de suspender
              el acceso en estos casos.
            </p>
          ),
        },
        {
          heading: '7. Limitación de responsabilidad',
          body: (
            <p>
              Revívelos se ofrece &ldquo;tal cual&rdquo;. Hacemos nuestro mejor esfuerzo para que el servicio esté
              disponible y funcione correctamente, pero no garantizamos que esté libre de interrupciones o
              errores en todo momento. En la medida permitida por la ley, nuestra responsabilidad frente a
              cualquier reclamo se limita al monto que hayas pagado por los créditos involucrados en ese reclamo.
              No somos responsables por daños indirectos derivados del uso del servicio.
            </p>
          ),
        },
        {
          heading: '8. Cambios al servicio y a estos términos',
          body: (
            <p>
              Podemos actualizar estos términos o modificar funciones del servicio. Si el cambio es importante,
              lo publicaremos en esta página con nueva fecha de actualización. El uso continuado de Revívelos
              después de un cambio implica que lo aceptas.
            </p>
          ),
        },
        {
          heading: '9. Legislación aplicable',
          body: (
            <p>
              Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia se
              someterá a los tribunales competentes, sin perjuicio de los derechos que la Ley Federal de
              Protección al Consumidor te reconoce como consumidor.
            </p>
          ),
        },
      ]}
    />
  )
}
