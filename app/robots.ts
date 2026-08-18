import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { SITE_URL, SITE_HOST } from '@/lib/site'

// VERCEL_ENV === 'production' NO alcanza por sí solo: el dominio
// *.vercel.app autogenerado del proyecto (ej. revivelos-two.vercel.app)
// es un alias de ese mismo deployment de producción, así que también
// reporta VERCEL_ENV=production — no es un "preview". Solo el host real
// de la petición distingue el dominio canónico de ese alias (o de
// cualquier preview/rama). Si no coincide, se bloquea todo el sitio.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers()
  const host = headersList.get('host')

  if (host !== SITE_HOST) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/mis-fotos', '/resultado/', '/procesando/', '/comprar/', '/gracias', '/api/', '/admin'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
