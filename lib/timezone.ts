// Zona horaria de referencia para el panel de admin (el dueño del negocio
// opera desde Monterrey). No confundir con `startOfTodayUTC` en `lib/jobs.ts`
// — esa es una decisión de negocio distinta y deliberada (día calendario UTC
// para el tope del free tier, ver AGENTS.md "Seguridad"), no un bug a corregir
// con este mismo helper.
export const ADMIN_TIMEZONE = 'America/Monterrey'

// Instante UTC que corresponde a la medianoche local de `date` en `timeZone`.
// Calcula el offset real vigente en ese instante (vía Intl) en vez de asumir
// uno fijo, para seguir siendo correcto si la zona alguna vez adopta DST.
export function startOfDayInTimeZone(date: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value
      return acc
    }, {})

  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  )
  const offsetMs = asUTC - date.getTime()
  const local = new Date(date.getTime() + offsetMs)
  const localMidnightAsUTC = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
  return new Date(localMidnightAsUTC - offsetMs)
}

// Para el panel de admin: `toLocaleDateString`/`toLocaleString` sin
// `timeZone` usan la zona del servidor (UTC en producción), no la de
// Monterrey — eso es lo que hacía que la última fecha mostrada pareciera
// "un día adelantada". Estos helpers fijan la zona explícitamente.
export function formatAdminDate(date: Date): string {
  return date.toLocaleDateString('es-MX', { timeZone: ADMIN_TIMEZONE })
}

export function formatAdminDateTime(date: Date): string {
  return date.toLocaleString('es-MX', { timeZone: ADMIN_TIMEZONE })
}

export function formatAdminTime(date: Date): string {
  return date.toLocaleTimeString('es-MX', { timeZone: ADMIN_TIMEZONE })
}

const WEEKDAY_ABBREV = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']

// `dateStr` es un YYYY-MM-DD ya calculado en calendario de Monterrey (por
// ejemplo `DaySeriesPoint.date` de `lib/admin-metrics.ts`) — se parsea como
// medianoche UTC solo para leer el día de la semana, sin volver a convertir
// zona horaria (eso ya se resolvió al construir el string).
export function weekdayAbbrevForDateString(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return WEEKDAY_ABBREV[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
}
