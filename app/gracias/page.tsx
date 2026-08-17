import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { GraciasClient } from './GraciasClient'

const description = 'Confirmación de tu compra de créditos en Revívelos.'

export const metadata = {
  title: 'Gracias por tu compra',
  description,
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ session_id?: string }>
}

export default async function GraciasPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/entrar')
  }
  if (!sessionId) {
    redirect('/#precios')
  }

  return <GraciasClient sessionId={sessionId} />
}
