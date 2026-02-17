import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../pages/api/auth/[...nextauth]'
import { isAdminEmail } from '../../../lib/auth'
import { listNodeVersions } from '../../../lib/db'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const nodeId = searchParams.get('node_id')
  if (!nodeId) return NextResponse.json({ error: 'node_id required' }, { status: 400 })
  const session = await getServerSession(authOptions)
  const email = session?.user?.email || ''
  if (!isAdminEmail(email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const versions = await listNodeVersions(nodeId, 20)
  return NextResponse.json({ versions })
}

