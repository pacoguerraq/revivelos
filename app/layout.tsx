import type { Metadata } from 'next'
import { Lora, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { StickyMobileCta } from '@/components/ui/StickyMobileCta'
import { MetaPixel } from '@/components/MetaPixel'
import { SITE_URL } from '@/lib/site'
import './globals.css'

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  weight: ['400', '600'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600'],
  display: 'swap',
})

const SITE_DESCRIPTION =
  'Dale nueva vida a las fotos viejas de tu familia. Restauramos, coloreamos y animamos tus recuerdos con inteligencia artificial. La primera foto es gratis.'

export const metadata: Metadata = {
  // El apex es la forma canónica: www.revivelos.com redirige 308 al
  // apex en Vercel — apuntar aquí a www generaría canonicals que a su
  // vez redirigen, lo cual Google penaliza.
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Revívelos — Restaura las fotos de tu familia',
    template: '%s — Revívelos',
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    siteName: 'Revívelos',
    title: 'Revívelos — Restaura las fotos de tu familia',
    description: SITE_DESCRIPTION,
    locale: 'es_MX',
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Revívelos — Restaura las fotos de tu familia',
    description: SITE_DESCRIPTION,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${lora.variable} ${inter.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <StickyMobileCta />
        <Analytics />
        <SpeedInsights />
        <MetaPixel />
      </body>
    </html>
  )
}
