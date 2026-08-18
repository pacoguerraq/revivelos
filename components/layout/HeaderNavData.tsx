import { getUserId } from '@/lib/cookies'
import { getBalance } from '@/lib/credits'
import { auth } from '@/lib/auth'
import { HeaderNav } from './HeaderNav'

// Server Component async, separado de Header — ver HeaderNavSkeleton en
// Header.tsx para el porqué de este split.
export async function HeaderNavData() {
  const [userId, session] = await Promise.all([getUserId(), auth()])
  const balance = await getBalance(userId)

  const navUser = session?.user
    ? { name: session.user.name ?? session.user.email ?? 'Tu cuenta' }
    : null

  return <HeaderNav freeUsed={balance.freeUsed} credits={balance.credits} user={navUser} />
}
