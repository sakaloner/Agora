import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/auth'
import { applySuggestion, setSuggestionStatus } from '../../../../lib/db'

export async function POST(req, { params }) {
  const { ok, session } = await requireAdmin()
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const id = params.id
  const body = await req.json().catch(() => ({}))
  const action = body?.action
  if (action === 'approve') {
    const result = await applySuggestion(id, session.user.email)
    return NextResponse.json({ ok: true, item: result })
  }
  if (action === 'reject') {
    await setSuggestionStatus(id, 'rejected')
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}

