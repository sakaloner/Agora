import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../pages/api/auth/[...nextauth]'
import { createDuplicateReport, listPendingDuplicates } from '../../../lib/db'
import { isAdminEmail, isBannedEmail } from '../../../lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email || '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const items = await listPendingDuplicates()
  return NextResponse.json({ duplicates: items })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isBannedEmail(session.user?.email || '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const { sourceId, targetId, reason } = body || {}
  if (!sourceId || !targetId) return NextResponse.json({ error: 'sourceId and targetId required' }, { status: 400 })
  const saved = await createDuplicateReport({ sourceId, targetId, reporterId: session.user?.email || 'unknown', reason })
  return NextResponse.json({ report: saved })
}
