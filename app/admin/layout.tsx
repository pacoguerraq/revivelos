import { notFound } from 'next/navigation'
import { isAdminConfigured } from '@/lib/admin-auth'

export const metadata = {
  robots: { index: false, follow: false },
}

// Si ADMIN_PASSWORD no está definida, /admin y todo lo que cuelgue de aquí
// no existe: 404, no un formulario de login que anuncia la herramienta.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminConfigured()) notFound()
  return <>{children}</>
}
