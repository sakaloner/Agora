import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../pages/api/auth/[...nextauth]'
import { isAdminEmail } from '../../../../../lib/auth'
import { softDeleteNode } from '../../../../../lib/db'

export async function POST(_req, { params }) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email || ''
  if (!isAdminEmail(email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await softDeleteNode(params.id, email)
  return NextResponse.json({ ok: true })
}

