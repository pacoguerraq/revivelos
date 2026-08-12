import { Accordion } from '@/components/ui/Accordion'
import { SectionHeading } from '@/components/ui/SectionHeading'

const FAQ_ITEMS = [
  {
    question: '¿De verdad la primera foto es gratis?',
    answer:
      'Sí, completamente gratis. No necesitas tarjeta de crédito ni crear una cuenta. Sube tu foto, elige "Restaurar y colorear" y el resultado es tuyo sin pagar nada. Solo necesitas comprar créditos si quieres restaurar más fotos o crear videos animados.',
  },
  {
    question: '¿Cómo funciona la restauración con inteligencia artificial?',
    answer:
      'Nuestra IA analiza cada píxel de tu foto, detecta zonas dañadas, rasgaduras o decoloración, y las reconstruye de manera inteligente. Luego agrega color de forma natural basándose en patrones históricos de la época en que fue tomada la foto. El proceso tarda un par de minutos.',
  },
  {
    question: '¿Mis fotos están seguras? ¿Las usan para algo más?',
    answer:
      'Tus fotos se usan únicamente para generar el resultado que pediste. No las compartimos, vendemos ni usamos para entrenar modelos de IA. Las eliminamos automáticamente de nuestros servidores después de 30 días.',
  },
  {
    question: '¿Qué calidad tiene el resultado gratuito vs el de pago?',
    answer:
      'La versión gratuita te muestra una vista previa con marca de agua y en resolución media, para que puedas ver cómo quedó antes de decidir. Si te gusta el resultado, puedes descargarlo en alta resolución y sin marca de agua usando un crédito.',
  },
  {
    question: '¿Para qué sirven los créditos?',
    answer:
      'Cada crédito te permite hacer una restauración adicional en alta resolución sin marca de agua. Los videos animados cuestan 3 créditos porque requieren más procesamiento. Los créditos no caducan, puedes usarlos cuando quieras.',
  },
  {
    question: '¿Funciona con cualquier tipo de foto?',
    answer:
      'Funciona mejor con retratos de personas. Acepta fotos en blanco y negro, sepia, fotos en color desteñidas, y fotos dañadas por el tiempo o humedad. El formato puede ser JPG, PNG, WEBP o HEIC. El tamaño máximo es 15 MB.',
  },
]

export function FAQ() {
  return (
    <section id="preguntas" className="py-16 sm:py-20">
      <div className="section-wrap">
        <SectionHeading
          title="Preguntas frecuentes"
          subtitle="Todo lo que necesitas saber antes de empezar."
          className="mb-10"
        />

        <div className="max-w-2xl mx-auto">
          <Accordion items={FAQ_ITEMS} />
        </div>
      </div>
    </section>
  )
}
