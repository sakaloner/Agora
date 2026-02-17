import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../pages/api/auth/[...nextauth]'
import { likeStats, toggleLike } from '../../../lib/db'
import { isBannedEmail } from '../../../lib/auth'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const nodeId = searchParams.get('node_id')
  if (!nodeId) return NextResponse.json({ error: 'node_id required' }, { status: 400 })
  const session = await getServerSession(authOptions)
  const userId = session?.user?.email || null
  const stats = await likeStats(nodeId, userId)
  return NextResponse.json(stats)
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isBannedEmail(session.user?.email || '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  if (!body?.nodeId) return NextResponse.json({ error: 'nodeId required' }, { status: 400 })
  const userId = session.user?.email
  const result = await toggleLike(body.nodeId, userId)
  const stats = await likeStats(body.nodeId, userId)
  return NextResponse.json({ ...result, ...stats })
}
