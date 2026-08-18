/**
 * BORRADOR — este texto lo redactó un agente de IA a partir de la
 * Ley Federal de Protección de Datos Personales en Posesión de los
 * Particulares (LFPDPPP). NO está revisado por un abogado. Debe pasar por
 * revisión legal antes de usarse en producción o de empezar a cobrar.
 */
import { LegalPage, LegalList } from '@/components/legal/LegalPage'
import { SITE_HOST } from '@/lib/site'

const description =
  'Cómo Revívelos recaba, usa y protege tus datos personales y tus fotografías, incluido el uso de proveedores de inteligencia artificial de terceros.'

export const metadata = {
  title: 'Aviso de privacidad',
  description,
  alternates: { canonical: '/privacidad' },
  openGraph: { title: 'Aviso de privacidad — Revívelos', description },
}

export default function PrivacidadPage() {
  return (
    <LegalPage
      title="Aviso de privacidad"
      updated="15 de agosto de 2026"
      intro="En Revívelos nos tomas tu confianza en serio: nos compartes fotos de tu familia, muchas veces de personas que ya no están con nosotros. Este aviso explica, en español sencillo, qué datos recabamos, para qué los usamos y qué derechos tienes sobre ellos."
      sections={[
        {
          heading: '1. Quién es responsable de tus datos',
          body: (
            <p>
              Revívelos (operado bajo el dominio {SITE_HOST}) es responsable del tratamiento de tus datos
              personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los
              Particulares (LFPDPPP). Puedes contactarnos en cualquier momento a{' '}
              <a href="mailto:contacto.revivelos@gmail.com" style={{ color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                contacto.revivelos@gmail.com
              </a>
              .
            </p>
          ),
        },
        {
          heading: '2. Qué datos recabamos',
          body: (
            <>
              <p>Recabamos solo lo necesario para darte el servicio:</p>
              <LegalList>
                <li>
                  <strong>Las fotografías que subes</strong> — para restaurarlas, colorearlas o animarlas.
                </li>
                <li>
                  <strong>Tu correo electrónico</strong> — únicamente si creas una cuenta (para comprar créditos
                  o guardar tu galería). No es obligatorio para probar el servicio gratis.
                </li>
                <li>
                  <strong>Nombre y foto de perfil</strong> — solo si entras con tu cuenta de Google; nunca los
                  pedimos por separado.
                </li>
                <li>
                  <strong>Datos técnicos de uso</strong> — una cookie anónima que identifica tu dispositivo
                  (para saber qué créditos tienes y evitar el abuso de la restauración gratuita), y datos básicos
                  de tu navegador con el mismo fin.
                </li>
                <li>
                  <strong>Datos de pago</strong> — cuando el pago con tarjeta esté disponible, lo procesará
                  directamente nuestro proveedor de pagos; nosotros no almacenamos números de tarjeta.
                </li>
              </LegalList>
            </>
          ),
        },
        {
          heading: '3. Para qué usamos tus datos',
          body: (
            <LegalList>
              <li>Generar la restauración, coloración o animación que pediste.</li>
              <li>Enviarte el enlace de acceso a tu cuenta por correo (sin contraseñas).</li>
              <li>Llevar el control de tus créditos y tu historial de fotos.</li>
              <li>Prevenir el uso abusivo de la vista previa gratuita.</li>
              <li>Responder tus dudas cuando nos escribes.</li>
              <li>Medir qué tan bien funcionan nuestros anuncios (ver sección 6, Meta Pixel).</li>
            </LegalList>
          ),
        },
        {
          heading: '4. Tus fotos y la inteligencia artificial de terceros',
          body: (
            <p>
              Para restaurar, colorear y animar tus fotos usamos un proveedor especializado de inteligencia
              artificial (fal.ai), al que le enviamos tu foto únicamente para procesarla y recibir el resultado.
              No usamos tus fotos para entrenar modelos de IA, no las vendemos y no las compartimos con nadie
              más que este proveedor de procesamiento. El archivo original y el resultado se eliminan de
              nuestros servidores <strong>30 días</strong> después de haberse creado.
            </p>
          ),
        },
        {
          heading: '5. Con quién más compartimos datos',
          body: (
            <>
              <p>Además del proveedor de IA, trabajamos con estos proveedores para operar el servicio:</p>
              <LegalList>
                <li>Google — si eliges entrar con tu cuenta de Google.</li>
                <li>Resend — para enviar el correo con tu enlace de acceso.</li>
                <li>Vercel y Neon — hospedan la aplicación y la base de datos.</li>
                <li>
                  Nuestro proveedor de pagos (cuando esté disponible) — procesa el cobro de los créditos que
                  compres.
                </li>
              </LegalList>
              <p style={{ marginTop: '0.75rem' }}>
                Todos están obligados contractualmente a proteger tus datos y a usarlos solo para el servicio
                que nos prestan a nosotros.
              </p>
            </>
          ),
        },
        {
          heading: '6. Meta Pixel y publicidad',
          body: (
            <p>
              Llegaste a Revívelos probablemente por un anuncio en Facebook o Instagram. Usamos el Pixel de Meta
              para medir qué tan bien funcionan esos anuncios (por ejemplo, cuántas personas visitan el sitio o
              suben una foto después de ver el anuncio). Esto no incluye tus fotos ni tu correo — son datos
              agregados de navegación. Puedes controlar esta publicidad desde la configuración de anuncios de tu
              cuenta de Meta.
            </p>
          ),
        },
        {
          heading: '7. Cuánto tiempo guardamos tus datos',
          body: (
            <LegalList>
              <li>
                <strong>Fotos y resultados:</strong> 30 días desde que se crean, después se eliminan de forma
                permanente.
              </li>
              <li>
                <strong>Cuenta, correo y créditos:</strong> mientras tu cuenta exista. Puedes pedir que la
                eliminemos en cualquier momento.
              </li>
            </LegalList>
          ),
        },
        {
          heading: '8. Tus derechos ARCO',
          body: (
            <p>
              Tienes derecho a <strong>Acceder</strong> a tus datos personales, <strong>Rectificar</strong>los si
              están desactualizados o son inexactos, <strong>Cancelar</strong>los cuando consideres que no se
              usan conforme a este aviso, y <strong>Oponerte</strong> a su tratamiento para fines específicos.
              Para ejercer cualquiera de estos derechos, escríbenos a{' '}
              <a href="mailto:contacto.revivelos@gmail.com" style={{ color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                contacto.revivelos@gmail.com
              </a>{' '}
              indicando tu correo de registro y qué quieres solicitar. Te responderemos en un plazo razonable.
            </p>
          ),
        },
        {
          heading: '9. Cambios a este aviso',
          body: (
            <p>
              Si cambiamos este aviso de forma importante, lo publicaremos en esta misma página con la fecha de
              actualización al inicio. Te recomendamos revisarlo de vez en cuando.
            </p>
          ),
        },
      ]}
    />
  )
}
