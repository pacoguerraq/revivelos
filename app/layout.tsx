import type { Metadata } from 'next'
import { Lora, Inter } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
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

export const metadata: Metadata = {
  title: 'Revívelos — Restaura las fotos de tu familia',
  description:
    'Dale nueva vida a las fotos viejas de tu familia. Restauramos, colorizamos y animamos tus recuerdos con inteligencia artificial. La primera foto es gratis.',
  openGraph: {
    title: 'Revívelos — Restaura las fotos de tu familia',
    description: 'La primera restauración es completamente gratis. Sin registro.',
    locale: 'es_MX',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${lora.variable} ${inter.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
