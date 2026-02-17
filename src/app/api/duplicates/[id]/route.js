import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/auth'
import { mergeNodes, setDuplicateReportStatus } from '../../../../lib/db'

export async function POST(req, { params }) {
  const { ok, session } = await requireAdmin()
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const id = params.id
  const body = await req.json().catch(() => ({}))
  const { action, canonicalId, duplicateId } = body || {}
  if (action === 'merge') {
    if (!canonicalId || !duplicateId) return NextResponse.json({ error: 'canonicalId and duplicateId required' }, { status: 400 })
    const merged = await mergeNodes(canonicalId, duplicateId, session.user.email)
    await setDuplicateReportStatus(id, 'approved')
    return NextResponse.json({ ok: true, item: merged })
  }
  if (action === 'reject') {
    await setDuplicateReportStatus(id, 'rejected')
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}

