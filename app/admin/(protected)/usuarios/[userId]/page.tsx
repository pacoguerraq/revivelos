import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import * as s from '@/components/admin/styles'
import { AdjustCreditsForm } from '@/components/admin/AdjustCreditsForm'

export const metadata = { robots: { index: false, follow: false } }

interface Props {
  params: Promise<{ userId: string }>
}

export default async function AdminUserDetailPage({ params }: Props) {
  // Ver nota en dashboard/page.tsx: el chequeo del layout no basta por sí
  // solo, porque Next puede renderizar esta página en paralelo con el
  // layout antes de que su notFound() la detenga.
  if (!(await verifyAdminSession())) notFound()

  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, credits: true, freeUsed: true, isAnonymous: true, createdAt: true, name: true },
  })
  if (!user) notFound()

  // Nunca se seleccionan inputUrl/outputUrl/restoredUrl — el admin puede
  // ver que un job existe y su estado, no el contenido de la foto.
  const [transactions, jobs] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, delta: true, reason: true, note: true, externalId: true, createdAt: true },
    }),
    prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, type: true, tier: true, status: true, stage: true, error: true, createdAt: true },
    }),
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={s.card}>
        <div style={s.sectionTitle}>{user.email ?? '(usuario anónimo sin correo)'}</div>
        <div style={s.grid}>
          <div>
            <div style={s.statValue}>{user.credits}</div>
            <div style={s.statLabel}>Créditos actuales</div>
          </div>
          <div>
            <div style={s.statValue}>{user.freeUsed ? 'sí' : 'no'}</div>
            <div style={s.statLabel}>Free tier usado</div>
          </div>
          <div>
            <div style={s.statValue}>{user.isAnonymous ? 'anónimo' : 'autenticado'}</div>
            <div style={s.statLabel}>Estado de cuenta</div>
          </div>
          <div>
            <div style={s.statValue}>{user.createdAt.toLocaleDateString('es-MX')}</div>
            <div style={s.statLabel}>Registro</div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#7A5C45' }}>id: {user.id}</div>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>Ajustar créditos</div>
        <AdjustCreditsForm userId={user.id} />
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>Historial de transacciones ({transactions.length})</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Fecha</th>
                <th style={s.th}>Delta</th>
                <th style={s.th}>Motivo</th>
                <th style={s.th}>Nota</th>
                <th style={s.th}>Externo</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td style={s.td}>{t.createdAt.toLocaleString('es-MX')}</td>
                  <td style={s.td}>{t.delta > 0 ? `+${t.delta}` : t.delta}</td>
                  <td style={s.td}>{t.reason}</td>
                  <td style={s.td}>{t.note ?? '—'}</td>
                  <td style={s.td}>{t.externalId ?? '—'}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td style={s.td} colSpan={5}>
                    Sin transacciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>Jobs ({jobs.length})</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Fecha</th>
                <th style={s.th}>Tipo</th>
                <th style={s.th}>Tier</th>
                <th style={s.th}>Estado</th>
                <th style={s.th}>Etapa</th>
                <th style={s.th}>Error</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td style={s.td}>{j.createdAt.toLocaleString('es-MX')}</td>
                  <td style={s.td}>{j.type}</td>
                  <td style={s.td}>{j.tier}</td>
                  <td style={s.td}>{j.status}</td>
                  <td style={s.td}>{j.stage}</td>
                  <td style={s.td}>{j.error ?? '—'}</td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td style={s.td} colSpan={6}>
                    Sin jobs.
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
