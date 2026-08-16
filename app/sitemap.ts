import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.revivelos.com'

// Solo rutas públicas e indexables. /mis-fotos, /resultado/*, /procesando/*
// y /api/* se excluyen aquí y en robots.ts — son páginas privadas o
// transaccionales, sin valor de búsqueda.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '/',
    '/crear',
    '/entrar',
    '/restaurar-fotos-antiguas',
    '/animar-fotos-en-video',
    '/acerca',
    '/privacidad',
    '/terminos',
    '/reembolsos',
  ]

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.5,
  }))
}
