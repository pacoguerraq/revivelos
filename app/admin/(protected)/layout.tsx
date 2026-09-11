import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { clearAdminSession, verifyAdminSession } from '@/lib/admin-auth'

async function logout() {
  'use server'
  await clearAdminSession()
  redirect('/admin')
}

// No es cálido, pero sí es responsive: el dueño lo revisa a diario y a
// veces desde el celular (ver AGENTS.md, sección Admin). El header envuelve
// (`flexWrap`) en vez de recortar cuando el viewport es angosto, y el
// padding/tamaño de fuente del contenido se achican con `clamp()` en vez de
// depender de un breakpoint fijo.
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await verifyAdminSession())) notFound()

  return (
    <div style={{ minHeight: '100vh', background: '#F4F1EC', color: '#1a1a1a', fontFamily: 'var(--font-sans)' }}>
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px 16px',
          padding: '12px clamp(12px, 4vw, 24px)',
          background: '#20160e',
          color: '#fff',
        }}
      >
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', alignItems: 'center' }}>
          <strong>Admin Revívelos</strong>
          <Link href="/admin/dashboard" style={{ color: '#EDE0CC' }}>
            Dashboard
          </Link>
          <Link href="/admin/usuarios" style={{ color: '#EDE0CC' }}>
            Usuarios
          </Link>
        </nav>
        <form action={logout}>
          <button
            type="submit"
            style={{ background: 'transparent', border: '1px solid #7A5C45', color: '#EDE0CC', borderRadius: 6, padding: '6px 14px', fontSize: '0.85rem' }}
          >
            Cerrar sesión
          </button>
        </form>
      </header>
      <main style={{ padding: 'clamp(12px, 4vw, 24px)', maxWidth: 1200, margin: '0 auto' }}>{children}</main>
    </div>
  )
}
