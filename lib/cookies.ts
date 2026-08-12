import { cookies } from 'next/headers'

export async function getUserId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('uid')?.value ?? 'anonymous'
}
