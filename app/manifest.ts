import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Revívelos — Restaura las fotos de tu familia',
    short_name: 'Revívelos',
    description: 'Restaura, colorea y anima las fotos antiguas de tu familia con inteligencia artificial.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF6F0',
    theme_color: '#A8640A',
    lang: 'es-MX',
    icons: [
      { src: '/icon.png', sizes: '676x676', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
