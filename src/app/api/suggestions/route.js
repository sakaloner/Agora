import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../pages/api/auth/[...nextauth]'
import { addSuggestion, listSuggestions } from '../../../lib/db'
import { isBannedEmail } from '../../../lib/auth'
import { isAdminEmail } from '../../../lib/auth'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const nodeId = searchParams.get('node_id')
  if (!nodeId) return NextResponse.json({ error: 'node_id required' }, { status: 400 })
  const session = await getServerSession(authOptions)
  const email = session?.user?.email || ''
  if (!isAdminEmail(email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const items = await listSuggestions(nodeId)
  return NextResponse.json({ suggestions: items })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isBannedEmail(session.user?.email || '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const nodeId = body?.nodeId
  if (!nodeId) return NextResponse.json({ error: 'nodeId required' }, { status: 400 })
  // Whitelist fields to avoid junk
  const allowed = ['name','country','tradition','website','description','bio']
  const proposed = {}
  for (const k of allowed) {
    if (typeof body[k] === 'string') proposed[k] = body[k]
  }
  const saved = await addSuggestion({ nodeId, userId: session.user?.email || 'unknown', proposed })
  return NextResponse.json({ suggestion: saved })
}
