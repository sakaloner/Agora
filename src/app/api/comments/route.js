import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../pages/api/auth/[...nextauth]'
import { listComments, addComment } from '../../../lib/db'
import { isBannedEmail } from '../../../lib/auth'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const nodeId = searchParams.get('node_id')
  if (!nodeId) return NextResponse.json({ error: 'node_id required' }, { status: 400 })
  try {
    const comments = await listComments(nodeId)
    return NextResponse.json({ comments })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (isBannedEmail(session.user?.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await req.json()
    if (!body?.nodeId || !body?.content) {
      return NextResponse.json({ error: 'nodeId and content required' }, { status: 400 })
    }
    const authorName = body.authorName || session.user?.name || session.user?.email || ''
    const saved = await addComment({ nodeId: body.nodeId, authorName, content: body.content })
    return NextResponse.json({ comment: saved })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
