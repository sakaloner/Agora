import { getServerSession } from 'next-auth/next'
import { authOptions } from '../pages/api/auth/[...nextauth]'

export async function currentSession() {
  try { return await getServerSession(authOptions) } catch { return null }
}

export function isAdminEmail(email) {
  const list = (process.env.AGORA_ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  return !!email && list.includes(email.toLowerCase())
}

export function isBannedEmail(email) {
  const list = (process.env.AGORA_BANNED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  return !!email && list.includes(email.toLowerCase())
}

export async function requireAdmin() {
  const session = await currentSession()
  if (!session?.user?.email) return { ok: false, session: null }
  return { ok: isAdminEmail(session.user.email), session }
}
