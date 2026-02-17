import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../pages/api/auth/[...nextauth]'
import { isBannedEmail } from '../../../lib/auth'
import { queryItems, upsertNode, findSimilarNodes } from '../../../lib/db'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'teacher'
  const q = searchParams.get('q') || ''
  const country = searchParams.get('country') || ''
  const tradition = searchParams.get('tradition') || ''
  const order = searchParams.get('order') || 'name'
  const limit = searchParams.get('limit') || '25'
  const offset = searchParams.get('offset') || '0'
  try {
    const items = await queryItems({ type, q, country, tradition, order, limit, offset })
    return NextResponse.json({ items })
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
    if (!body?.type || !body?.name) {
      return NextResponse.json({ error: 'type and name are required' }, { status: 400 })
    }
    const force = !!body.force
    if (!body.id && !force) {
      const matches = await findSimilarNodes({ type: body.type, name: body.name, country: body.country, tradition: body.tradition })
      if (matches.length > 0) {
        return NextResponse.json({ duplicate: true, matches }, { status: 409 })
      }
    }
    const saved = await upsertNode({
      id: body.id,
      type: body.type,
      name: body.name,
      country: body.country || '',
      tradition: body.tradition || '',
      website: body.website || '',
      photo_url: body.photo_url || '',
      description: body.description || '',
      bio: body.bio || ''
    })
    return NextResponse.json({ item: saved })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
