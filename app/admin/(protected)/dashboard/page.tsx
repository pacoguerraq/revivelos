import { notFound } from 'next/navigation'
import {
  getTodayYesterdaySummary,
  getDailySeries,
  getRecentPurchases,
  FREE_TIER_DAILY_CAP,
  FREE_TIER_ENABLED,
} from '@/lib/admin-metrics'
import { verifyAdminSession } from '@/lib/admin-auth'
import * as s from '@/components/admin/styles'
import type { DaySummary } from '@/lib/admin-metrics'

export const metadata = { robots: { index: false, follow: false } }

function mxn(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={s.card}>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>
        {label}
        {sub ? ` — ${sub}` : ''}
      </div>
    </div>
  )
}

function SummaryColumn({ title, d }: { title: string; d: DaySummary }) {
  const margin = d.revenueMxn - d.costMxn
  return (
    <div style={s.card}>
      <div style={s.sectionTitle}>{title}</div>
      <div style={s.grid}>
        <Stat label="Free tier usado" value={`${d.freeUsed} / ${FREE_TIER_DAILY_CAP}`} />
        <Stat label="Restauraciones pagadas" value={String(d.paidRestore)} />
        <Stat label="Videos pagados" value={String(d.paidAnimate)} />
        <Stat label="Jobs fallidos" value={String(d.failed)} />
        <Stat label="Compras" value={String(d.purchaseCount)} />
        <Stat label="Usuarios nuevos" value={String(d.newUsers)} />
        <Stat label="Ingreso" value={mxn(d.revenueMxn)} />
        <Stat label="Costo API estimado" value={mxn(d.costMxn)} />
        <Stat label="Margen estimado" value={mxn(margin)} sub={margin >= 0 ? 'positivo' : 'negativo'} />
      </div>
    </div>
  )
}

// Gráfica de barras simple en SVG inline, sin librerías (ver instrucción
// explícita del pedido).
function MiniBarChart({
  points,
  pick,
  color,
  height = 60,
}: {
  points: { date: string; value: number }[]
  pick: (p: { date: string; value: number }) => number
  color: string
  height?: number
}) {
  const max = Math.max(1, ...points.map(pick))
  const barWidth = 100 / points.length
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      {points.map((p, i) => {
        const value = pick(p)
        const barHeight = (value / max) * (height - 2)
        return (
          <rect
            key={p.date}
            x={i * barWidth + barWidth * 0.15}
            y={height - barHeight}
            width={barWidth * 0.7}
            height={barHeight}
            fill={color}
          >
            <title>{`${p.date}: ${value}`}</title>
          </rect>
        )
      })}
    </svg>
  )
}

export default async function AdminDashboardPage() {
  // Repetido a propósito respecto al layout: Next.js puede empezar a
  // renderizar page y layout en paralelo, así que un notFound() solo en el
  // layout no evita que las queries de esta página corran y su resultado
  // se serialice en el payload RSC de la respuesta. Este chequeo temprano
  // (antes de cualquier query) es lo que de verdad impide la fuga de datos
  // a una petición sin cookie válida.
  if (!(await verifyAdminSession())) notFound()

  const [{ today, yesterday, failedToday }, series, purchases] = await Promise.all([
    getTodayYesterdaySummary(),
    getDailySeries(30),
    getRecentPurchases(20),
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ ...s.card, display: 'flex', gap: 24 }}>
        <div>
          <div style={s.statLabel}>FREE_TIER_ENABLED</div>
          <div style={{ ...s.statValue, fontSize: '1.1rem', color: FREE_TIER_ENABLED ? '#4A7C59' : '#B84040' }}>
            {FREE_TIER_ENABLED ? 'activado' : 'apagado'}
          </div>
        </div>
        <div>
          <div style={s.statLabel}>FREE_TIER_DAILY_CAP</div>
          <div style={{ ...s.statValue, fontSize: '1.1rem' }}>{FREE_TIER_DAILY_CAP}</div>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#7A5C45', alignSelf: 'center' }}>
          Solo lectura — se cambian en Vercel, no aquí.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SummaryColumn title="Hoy" d={today} />
        <SummaryColumn title="Ayer" d={yesterday} />
      </div>

      {failedToday.length > 0 && (
        <div style={s.card}>
          <div style={s.sectionTitle}>Jobs fallidos hoy ({failedToday.length})</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Hora</th>
                  <th style={s.th}>Tipo</th>
                  <th style={s.th}>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {failedToday.map((j) => (
                  <tr key={j.id}>
                    <td style={s.td}>{j.createdAt.toLocaleTimeString('es-MX')}</td>
                    <td style={s.td}>{j.type}</td>
                    <td style={s.td}>{j.error ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={s.card}>
        <div style={s.sectionTitle}>Últimos 30 días</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={s.statLabel}>Free tier usado</div>
            <MiniBarChart points={series.map((p) => ({ date: p.date, value: p.freeUsed }))} pick={(p) => p.value} color="#C9A87C" />
          </div>
          <div>
            <div style={s.statLabel}>Jobs de pago</div>
            <MiniBarChart points={series.map((p) => ({ date: p.date, value: p.paidJobs }))} pick={(p) => p.value} color="#A8640A" />
          </div>
          <div>
            <div style={s.statLabel}>Ingreso (MXN)</div>
            <MiniBarChart points={series.map((p) => ({ date: p.date, value: p.revenueMxn }))} pick={(p) => p.value} color="#4A7C59" />
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Fecha</th>
                <th style={s.th}>Free tier</th>
                <th style={s.th}>Jobs de pago</th>
                <th style={s.th}>Compras</th>
                <th style={s.th}>Ingreso</th>
              </tr>
            </thead>
            <tbody>
              {[...series].reverse().map((p) => (
                <tr key={p.date}>
                  <td style={s.td}>{p.date}</td>
                  <td style={s.td}>{p.freeUsed}</td>
                  <td style={s.td}>{p.paidJobs}</td>
                  <td style={s.td}>{p.purchases}</td>
                  <td style={s.td}>{mxn(p.revenueMxn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>Compras recientes</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Fecha</th>
                <th style={s.th}>Correo</th>
                <th style={s.th}>Paquete</th>
                <th style={s.th}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td style={s.td}>{p.createdAt.toLocaleString('es-MX')}</td>
                  <td style={s.td}>{p.userEmail ?? '(sin correo)'}</td>
                  <td style={s.td}>{p.packageName}</td>
                  <td style={s.td}>{mxn(p.amountMxn)}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td style={s.td} colSpan={4}>
                    Sin compras todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
