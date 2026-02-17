import { NextResponse } from 'next/server'
import { getNode } from '../../../../lib/db'

export async function GET(req, { params }) {
  try {
    const item = await getNode(params.id)
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
  }
}