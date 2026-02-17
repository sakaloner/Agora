import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../pages/api/auth/[...nextauth]'
import { isAdminEmail, isBannedEmail } from '../../../lib/auth'
import { ensureInitialized } from '../../../lib/db'
import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data.db')
let db
function getDb() { if (!db) db = new sqlite3.Database(DB_PATH); return db }
function run(sql, params=[]) { return new Promise((res, rej) => getDb().run(sql, params, function(e){ e?rej(e):res(this) })) }
function all(sql, params=[]) { return new Promise((res, rej) => getDb().all(sql, params, (e, rows)=> e?rej(e):res(rows))) }

async function init() {
  await ensureInitialized()
  await run(`CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    message TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`)
}

import { nanoid } from 'nanoid'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email || '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await init()
  const rows = await all('SELECT id, email, name, message, created_at FROM contact_messages ORDER BY created_at DESC')
  return NextResponse.json({ messages: rows })
}

export async function POST(req) {
  const body = await req.json().catch(()=>({}))
  const { email, name, message } = body || {}
  if (!message || String(message).trim().length === 0) return NextResponse.json({ error: 'message required' }, { status: 400 })
  const session = await getServerSession(authOptions)
  if (session && isBannedEmail(session.user?.email || '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await init()
  await run('INSERT INTO contact_messages (id, email, name, message, created_at) VALUES (?,?,?,?,?)', [nanoid(), email || session?.user?.email || '', name || session?.user?.name || '', message, Date.now()])
  return NextResponse.json({ ok: true })
}

