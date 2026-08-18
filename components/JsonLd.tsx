import { FAQ_ITEMS } from '@/components/landing/FAQ'
import { SITE_URL as BASE_URL } from '@/lib/site'

// JSON-LD de la home: Organization + WebSite, y FAQPage derivado del mismo
// arreglo que renderiza el acordeón visible — nunca se duplica el
// contenido a mano, así que no se puede desincronizar.
export function JsonLd() {
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Revívelos',
      url: BASE_URL,
      logo: `${BASE_URL}/icon.png`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Revívelos',
      url: BASE_URL,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
