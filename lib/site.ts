// Fuente única del dominio canónico. Canónico: el apex (https://revivelos.com),
// www.revivelos.com redirige 308 al apex en Vercel — nunca al revés. Ver AGENTS.md.
const DEFAULT_SITE_URL = 'https://revivelos.com'

export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? DEFAULT_SITE_URL).replace(/\/$/, '')
export const SITE_HOST = new URL(SITE_URL).host
