import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../pages/api/auth/[...nextauth]'
import { isBannedEmail } from '../../../lib/auth'
import { ensureInitialized } from '../../../lib/db'
import sqlite3 from 'sqlite3'
import path from 'path'
import { nanoid } from 'nanoid'

const DB_PATH = path.join(process.cwd(), 'data.db')
let db
function getDb() { if (!db) db = new sqlite3.Database(DB_PATH); return db }
function run(sql, params=[]) { return new Promise((res, rej) => getDb().run(sql, params, function(e){ e?rej(e):res(this) })) }
function all(sql, params=[]) { return new Promise((res, rej) => getDb().all(sql, params, (e, rows)=> e?rej(e):res(rows))) }

async function init() { await ensureInitialized() }

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const nodeId = searchParams.get('node_id')
  if (!nodeId) return NextResponse.json({ error: 'node_id required' }, { status: 400 })
  await init()
  const out = await all('SELECT id, from_id, to_id, relation FROM edges WHERE from_id = ? OR to_id = ?', [nodeId, nodeId])
  return NextResponse.json({ edges: out })
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (isBannedEmail(session.user?.email || '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const body = await req.json()
    const { from_id, to_id, relation } = body || {}
    console.log('POST /api/edges received:', { from_id, to_id, relation })
    
    if (!from_id || !to_id || !relation) return NextResponse.json({ error: 'from_id, to_id, relation required' }, { status: 400 })
    if (from_id === to_id) return NextResponse.json({ error: 'self loop not allowed' }, { status: 400 })
    
    await init()
    const id = nanoid()
    console.log('Inserting edge with id:', id)
    
    await run('INSERT INTO edges (id, from_id, to_id, relation) VALUES (?,?,?,?)', [id, from_id, to_id, relation])
    
    console.log('Edge inserted successfully')
    return NextResponse.json({ ok: true, id })
  } catch (error) {
    console.error('Error in POST /api/edges:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

