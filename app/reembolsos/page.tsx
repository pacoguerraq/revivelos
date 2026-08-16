/**
 * BORRADOR — este texto lo redactó un agente de IA. NO está revisado por
 * un abogado. Debe pasar por revisión legal antes de usarse en producción
 * o de empezar a cobrar.
 */
import { LegalPage } from '@/components/legal/LegalPage'

const description =
  'Cuándo Revívelos reembolsa un crédito automáticamente, bajo qué condiciones se devuelve dinero y cómo solicitar ayuda.'

export const metadata = {
  title: 'Política de reembolsos',
  description,
  alternates: { canonical: '/reembolsos' },
  openGraph: { title: 'Política de reembolsos — Revívelos', description },
}

export default function ReembolsosPage() {
  return (
    <LegalPage
      title="Política de reembolsos"
      updated="15 de agosto de 2026"
      intro="Queremos que sepas exactamente qué esperar antes de comprar. Aquí explicamos, sin letras chiquitas, cuándo te devolvemos un crédito o tu dinero."
      sections={[
        {
          heading: '1. Si la generación falla, el crédito se reembolsa automáticamente',
          body: (
            <p>
              Si al restaurar o animar tu foto ocurre un error técnico de nuestro sistema o del proveedor de
              inteligencia artificial, el crédito que gastaste se devuelve <strong>automáticamente</strong> a tu
              saldo — no necesitas escribirnos ni solicitarlo. Verás el mensaje de error en pantalla y el crédito
              disponible de nuevo de inmediato. Esto ya está implementado y funcionando en el sistema, no es una
              promesa a futuro.
            </p>
          ),
        },
        {
          heading: '2. La vista previa gratuita no es reembolsable',
          body: (
            <p>
              La primera restauración gratuita no cuesta ningún crédito ni dinero, así que no aplica ningún
              reembolso sobre ella. Es precisamente la forma en que puedes ver la calidad del resultado antes de
              decidir si comprar créditos.
            </p>
          ),
        },
        {
          heading: '3. Resultado técnicamente correcto pero que no te convenció',
          body: (
            <p>
              Si la restauración se completó sin errores pero el estilo, el color o la animación no salieron
              como esperabas, no ofrecemos un reembolso automático — es un resultado de un proceso creativo de
              IA que puede variar (ver la sección 4 de nuestros{' '}
              <a href="/terminos" style={{ color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                Términos y condiciones
              </a>
              ). Aun así, escríbenos: si el resultado se ve claramente dañado, incompleto o muy alejado de lo que
              el servicio promete, lo evaluamos caso por caso y, si tienes razón, te reembolsamos el crédito o te
              lo volvemos a generar sin costo.
            </p>
          ),
        },
        {
          heading: '4. Créditos comprados y no usados',
          body: (
            <p>
              Si compraste un paquete de créditos y decides que ya no quieres usarlo, puedes solicitar el
              reembolso del dinero dentro de los <strong>7 días naturales</strong> siguientes a la compra,
              siempre que no hayas usado ningún crédito del paquete. Si ya usaste al menos un crédito, se
              reembolsa el paquete completo menos el costo de los créditos ya utilizados.
            </p>
          ),
        },
        {
          heading: '5. Cobros duplicados o incorrectos',
          body: (
            <p>
              Si te cobramos dos veces por el mismo paquete, o un monto distinto al que aceptaste, te
              reembolsamos el cargo incorrecto por completo en cuanto lo confirmemos. Esto no tiene límite de
              tiempo de 7 días — repórtalo en cuanto lo detectes.
            </p>
          ),
        },
        {
          heading: '6. Cómo solicitar un reembolso',
          body: (
            <p>
              Escríbenos a{' '}
              <a href="mailto:franciscoguerraquintanilla@gmail.com" style={{ color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                franciscoguerraquintanilla@gmail.com
              </a>{' '}
              con tu correo de registro y una breve descripción de lo que pasó. Te respondemos en un plazo
              razonable y, si el reembolso procede, se hace al mismo medio de pago con el que compraste.
            </p>
          ),
        },
        {
          heading: '7. Tus derechos como consumidor',
          body: (
            <p>
              Esta política no limita los derechos que la Procuraduría Federal del Consumidor (Profeco) te
              reconoce como consumidor en México. Si consideras que no resolvimos tu caso de forma justa, puedes
              acudir a Profeco.
            </p>
          ),
        },
      ]}
    />
  )
}
