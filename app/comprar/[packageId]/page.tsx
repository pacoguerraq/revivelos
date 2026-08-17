import { ComprarClient } from './ComprarClient'

// Página transaccional — nunca debe indexarse, igual que /procesando o /resultado.
export const metadata = {
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ packageId: string }>
}

export default async function ComprarPage({ params }: Props) {
  const { packageId } = await params
  return <ComprarClient packageId={packageId} />
}
