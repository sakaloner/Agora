import { nanoid } from 'nanoid'
import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'

// Store DB in project root when running inside the app folder
const DB_PATH = path.join(process.cwd(), 'data.db')

let dbInstance = null
let initialized = false

function getDb() {
  if (!dbInstance) {
    // Ensure directory exists
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    dbInstance = new sqlite3.Database(DB_PATH)
  }
  return dbInstance
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export async function ensureInitialized() {
  if (initialized) return
  const db = getDb()
  await run(db, `CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    country TEXT,
    tradition TEXT,
    website TEXT,
    description TEXT,
    bio TEXT,
    photo_url TEXT,
    deleted_at INTEGER,
    deleted_by TEXT
  )`)

  await run(db, `CREATE TABLE IF NOT EXISTS edges (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    relation TEXT NOT NULL,
    FOREIGN KEY(from_id) REFERENCES nodes(id),
    FOREIGN KEY(to_id) REFERENCES nodes(id)
  )`)

  await run(db, `CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(node_id, user_id),
    FOREIGN KEY(node_id) REFERENCES nodes(id)
  )`)

  await run(db, `CREATE TABLE IF NOT EXISTS suggestions (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    proposed_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    FOREIGN KEY(node_id) REFERENCES nodes(id)
  )`)

  await run(db, `CREATE TABLE IF NOT EXISTS node_versions (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    editor_id TEXT NOT NULL,
    old_json TEXT NOT NULL,
    new_json TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(node_id) REFERENCES nodes(id)
  )`)

  await run(db, `CREATE TABLE IF NOT EXISTS duplicate_reports (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reporter_id TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    FOREIGN KEY(source_id) REFERENCES nodes(id),
    FOREIGN KEY(target_id) REFERENCES nodes(id)
  )`)

  await run(db, `CREATE TABLE IF NOT EXISTS aliases (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    alias TEXT NOT NULL,
    FOREIGN KEY(node_id) REFERENCES nodes(id)
  )`)

  // Ensure new columns exist for older DBs
  const info = await all(db, `PRAGMA table_info(nodes)`)
  const hasBio = info.some(c => c.name === 'bio')
  if (!hasBio) {
    try { await run(db, 'ALTER TABLE nodes ADD COLUMN bio TEXT') } catch {}
  }
  if (!info.some(c => c.name === 'photo_url')) {
    try { await run(db, 'ALTER TABLE nodes ADD COLUMN photo_url TEXT') } catch {}
  }
  if (!info.some(c => c.name === 'deleted_at')) {
    try { await run(db, 'ALTER TABLE nodes ADD COLUMN deleted_at INTEGER') } catch {}
  }
  if (!info.some(c => c.name === 'deleted_by')) {
    try { await run(db, 'ALTER TABLE nodes ADD COLUMN deleted_by TEXT') } catch {}
  }

  await run(db, `CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    author_name TEXT,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(node_id) REFERENCES nodes(id)
  )`)

  // Seed minimal sample if empty
  const rows = await all(db, 'SELECT COUNT(*) as c FROM nodes')
  if (rows[0].c === 0) {
    const teacher1 = { id: nanoid(), type:'teacher', name:'Ajahn Chah', country:'TH', tradition:'Theravada', website:'', description:'Thai Forest Tradition master.' }
    const teacher2 = { id: nanoid(), type:'teacher', name:'Thich Nhat Hanh', country:'VN', tradition:'Zen', website:'https://plumvillage.org', description:'Zen master and peace activist.' }
    const monastery1 = { id: nanoid(), type:'monastery', name:'Wat Pah Pong', country:'TH', tradition:'Theravada', website:'', description:'Monastery founded by Ajahn Chah.' }
    const retreat1 = { id: nanoid(), type:'retreat', name:'Plum Village Retreat', country:'FR', tradition:'Zen', website:'https://plumvillage.org', description:'Mindfulness retreats in France.' }
    const event1 = { id: nanoid(), type:'event', name:'Zen Winter Retreat', country:'FR', tradition:'Zen', website:'', description:'A week-long meditation retreat.' }

    for (const n of [teacher1, teacher2, monastery1, retreat1, event1]) {
      await run(db, 'INSERT INTO nodes (id,type,name,country,tradition,website,description,bio,photo_url) VALUES (?,?,?,?,?,?,?,?,?)',
        [n.id, n.type, n.name, n.country, n.tradition, n.website, n.description, '', ''])
    }
    await run(db, 'INSERT INTO edges (id, from_id, to_id, relation) VALUES (?,?,?,?)',
      [nanoid(), teacher1.id, monastery1.id, 'affiliated_with'])
    await run(db, 'INSERT INTO edges (id, from_id, to_id, relation) VALUES (?,?,?,?)',
      [nanoid(), teacher2.id, retreat1.id, 'hosts'])
  }

  initialized = true
}

export async function queryItems({ type, q, country, tradition, order = 'name', limit = 25, offset = 0 }) {
  await ensureInitialized()
  const db = getDb()

  const where = []
  const params = []
  if (type) { where.push('type = ?'); params.push(type) }
  if (q) {
    where.push('(LOWER(name) LIKE ? OR LOWER(country) LIKE ? OR LOWER(tradition) LIKE ?)')
    const p = `%${q.toLowerCase()}%`
    params.push(p, p, p)
  }
  if (country) { where.push('LOWER(country) = ?'); params.push(country.toLowerCase()) }
  if (tradition) { where.push('LOWER(tradition) LIKE ?'); params.push(`%${tradition.toLowerCase()}%`) }

  where.push('deleted_at IS NULL')
  const whereSql = 'WHERE ' + where.join(' AND ')
  const sql = `SELECT id, type, name, country, tradition, website, description,
               (SELECT COUNT(*) FROM likes l WHERE l.node_id = nodes.id) AS like_count
               FROM nodes ${whereSql}
               ORDER BY ${order === 'likes' ? 'like_count DESC, name ASC' : 'name ASC'}
               LIMIT ? OFFSET ?`
  params.push(Number(limit) || 25, Number(offset) || 0)

  return await all(db, sql, params)
}

export async function upsertNode(node) {
  await ensureInitialized()
  const db = getDb()
  const id = node.id || nanoid()
  const existing = await all(db, 'SELECT id FROM nodes WHERE id = ?', [id])
  if (existing.length) {
    await run(db, 'UPDATE nodes SET type=?, name=?, country=?, tradition=?, website=?, description=?, bio=?, photo_url=? WHERE id=?',
      [node.type, node.name, node.country, node.tradition, node.website, node.description, node.bio || '', node.photo_url || '', id])
    return { ...node, id }
  } else {
    await run(db, 'INSERT INTO nodes (id,type,name,country,tradition,website,description,bio,photo_url) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, node.type, node.name, node.country, node.tradition, node.website, node.description, node.bio || '', node.photo_url || ''])
    return { ...node, id }
  }
}

export async function getNode(id) {
  await ensureInitialized()
  const db = getDb()
  const rows = await all(db, `SELECT id, type, name, country, tradition, website, description, bio, photo_url,
    (SELECT COUNT(*) FROM likes l WHERE l.node_id = nodes.id) AS like_count
    FROM nodes WHERE id = ? AND deleted_at IS NULL`, [id])
  return rows[0] || null
}

export async function listComments(nodeId) {
  await ensureInitialized()
  const db = getDb()
  return await all(db, 'SELECT id, node_id, author_name, content, created_at FROM comments WHERE node_id = ? ORDER BY created_at DESC', [nodeId])
}

export async function addComment({ nodeId, authorName, content }) {
  await ensureInitialized()
  const db = getDb()
  const id = nanoid()
  const ts = Date.now()
  await run(db, 'INSERT INTO comments (id, node_id, author_name, content, created_at) VALUES (?,?,?,?,?)', [id, nodeId, authorName || '', content, ts])
  return { id, node_id: nodeId, author_name: authorName || '', content, created_at: ts }
}

export async function likeStats(nodeId, userId) {
  await ensureInitialized()
  const db = getDb()
  const countRows = await all(db, 'SELECT COUNT(*) as c FROM likes WHERE node_id = ?', [nodeId])
  const likedRows = userId ? await all(db, 'SELECT 1 FROM likes WHERE node_id = ? AND user_id = ? LIMIT 1', [nodeId, userId]) : []
  return { count: countRows[0]?.c || 0, liked: likedRows.length > 0 }
}

export async function toggleLike(nodeId, userId) {
  await ensureInitialized()
  const db = getDb()
  const existing = await all(db, 'SELECT id FROM likes WHERE node_id = ? AND user_id = ?', [nodeId, userId])
  if (existing.length) {
    await run(db, 'DELETE FROM likes WHERE node_id = ? AND user_id = ?', [nodeId, userId])
    return { liked: false }
  } else {
    await run(db, 'INSERT INTO likes (id, node_id, user_id, created_at) VALUES (?,?,?,?)', [nanoid(), nodeId, userId, Date.now()])
    return { liked: true }
  }
}

export async function addSuggestion({ nodeId, userId, proposed }) {
  await ensureInitialized()
  const db = getDb()
  const id = nanoid()
  const ts = Date.now()
  const json = JSON.stringify(proposed || {})
  await run(db, 'INSERT INTO suggestions (id, node_id, user_id, proposed_json, status, created_at) VALUES (?,?,?,?,?,?)', [id, nodeId, userId, json, 'pending', ts])
  return { id, node_id: nodeId, user_id: userId, proposed, status: 'pending', created_at: ts }
}

export async function listSuggestions(nodeId) {
  await ensureInitialized()
  const db = getDb()
  const rows = await all(db, 'SELECT id, node_id, user_id, proposed_json, status, created_at FROM suggestions WHERE node_id = ? ORDER BY created_at DESC', [nodeId])
  return rows.map(r => ({
    id: r.id,
    node_id: r.node_id,
    user_id: r.user_id,
    proposed: JSON.parse(r.proposed_json || '{}'),
    status: r.status,
    created_at: r.created_at,
  }))
}

export async function listPendingSuggestions() {
  await ensureInitialized()
  const db = getDb()
  const rows = await all(db, `
    SELECT s.id, s.node_id, s.user_id, s.proposed_json, s.status, s.created_at,
           n.name as node_name, n.type as node_type
    FROM suggestions s
    JOIN nodes n ON n.id = s.node_id
    WHERE s.status = 'pending'
    ORDER BY s.created_at DESC
  `)
  return rows.map(r => ({
    id: r.id,
    node_id: r.node_id,
    node_name: r.node_name,
    node_type: r.node_type,
    user_id: r.user_id,
    proposed: JSON.parse(r.proposed_json || '{}'),
    status: r.status,
    created_at: r.created_at,
  }))
}

export async function getSuggestionById(id) {
  await ensureInitialized()
  const db = getDb()
  const rows = await all(db, 'SELECT id, node_id, user_id, proposed_json, status, created_at FROM suggestions WHERE id = ?', [id])
  const s = rows[0]
  if (!s) return null
  return { id: s.id, node_id: s.node_id, user_id: s.user_id, proposed: JSON.parse(s.proposed_json || '{}'), status: s.status, created_at: s.created_at }
}

export async function setSuggestionStatus(id, status) {
  await ensureInitialized()
  const db = getDb()
  await run(db, 'UPDATE suggestions SET status=? WHERE id=?', [status, id])
}

export async function applySuggestion(id, approverId) {
  await ensureInitialized()
  const db = getDb()
  const s = await getSuggestionById(id)
  if (!s) throw new Error('Suggestion not found')
  if (s.status !== 'pending') {
    // Idempotent: return current node without error if already processed
    return await getNode(s.node_id)
  }

  const node = await getNode(s.node_id)
  if (!node) throw new Error('Target node not found')

  const allowed = ['name','country','tradition','website','description','bio']
  const newNode = { ...node }
  for (const k of allowed) {
    if (typeof s.proposed[k] === 'string') newNode[k] = s.proposed[k]
  }

  await run(db, 'BEGIN')
  try {
    await upsertNode({ id: node.id, type: node.type, name: newNode.name, country: newNode.country, tradition: newNode.tradition, website: newNode.website, description: newNode.description, bio: newNode.bio })
    await run(db, 'INSERT INTO node_versions (id, node_id, editor_id, old_json, new_json, source, created_at) VALUES (?,?,?,?,?,?,?)', [nanoid(), node.id, approverId, JSON.stringify(node), JSON.stringify(newNode), 'suggestion', Date.now()])
    await setSuggestionStatus(id, 'approved')
    await run(db, 'COMMIT')
  } catch (e) {
    await run(db, 'ROLLBACK')
    throw e
  }

  return newNode
}

export async function findSimilarNodes({ type, name, country, tradition, limit = 5 }) {
  await ensureInitialized()
  const db = getDb()
  const q = (name || '').toLowerCase().trim()
  if (!type || !q) return []
  const like1 = `% ${q} %`
  const like2 = `${q}%`
  const like3 = `%${q}%`
  const where = ['type = ?', '(LOWER(name) = ? OR LOWER(name) LIKE ? OR LOWER(name) LIKE ?)']
  const params = [type, q, like2, like3]
  if (country) { where.push('LOWER(IFNULL(country, "")) = ?'); params.push(country.toLowerCase()) }
  if (tradition) { where.push('LOWER(IFNULL(tradition, "")) LIKE ?'); params.push(`%${tradition.toLowerCase()}%`) }
  const sql = `SELECT id, type, name, country, tradition, website, description,
               (SELECT COUNT(*) FROM likes l WHERE l.node_id = nodes.id) AS like_count
               FROM nodes WHERE ${where.join(' AND ')}
               ORDER BY name ASC LIMIT ?`
  params.push(Number(limit) || 5)
  return await all(db, sql, params)
}

export async function listNodeVersions(nodeId, limit = 10) {
  await ensureInitialized()
  const db = getDb()
  const rows = await all(db, 'SELECT id, node_id, editor_id, old_json, new_json, source, created_at FROM node_versions WHERE node_id = ? ORDER BY created_at DESC LIMIT ?', [nodeId, limit])
  return rows.map(r => ({
    id: r.id,
    node_id: r.node_id,
    editor_id: r.editor_id,
    old: JSON.parse(r.old_json || '{}'),
    next: JSON.parse(r.new_json || '{}'),
    source: r.source,
    created_at: r.created_at,
  }))
}

export async function createDuplicateReport({ sourceId, targetId, reporterId, reason }) {
  await ensureInitialized()
  const db = getDb()
  const id = nanoid()
  const ts = Date.now()
  await run(db, 'INSERT INTO duplicate_reports (id, source_id, target_id, reporter_id, reason, status, created_at) VALUES (?,?,?,?,?,?,?)', [id, sourceId, targetId, reporterId, reason || '', 'pending', ts])
  return { id, source_id: sourceId, target_id: targetId, reporter_id: reporterId, reason: reason || '', status: 'pending', created_at: ts }
}

export async function listPendingDuplicates() {
  await ensureInitialized()
  const db = getDb()
  const rows = await all(db, `
    SELECT d.id, d.source_id, d.target_id, d.reporter_id, d.reason, d.status, d.created_at,
           s.name as source_name, s.type as source_type,
           t.name as target_name, t.type as target_type
    FROM duplicate_reports d
    JOIN nodes s ON s.id = d.source_id
    JOIN nodes t ON t.id = d.target_id
    WHERE d.status = 'pending'
    ORDER BY d.created_at DESC`)
  return rows
}

export async function setDuplicateReportStatus(id, status) {
  await ensureInitialized()
  const db = getDb()
  await run(db, 'UPDATE duplicate_reports SET status=? WHERE id=?', [status, id])
}

export async function mergeNodes(canonicalId, duplicateId, approverId) {
  await ensureInitialized()
  if (canonicalId === duplicateId) throw new Error('Cannot merge the same node')
  const db = getDb()
  const canonical = await getNode(canonicalId)
  const dup = await getNode(duplicateId)
  if (!canonical || !dup) throw new Error('Node not found')
  if (canonical.type !== dup.type) throw new Error('Types must match for merge')

  const merged = { ...canonical }
  for (const k of ['name','country','tradition','website','description','bio','photo_url']) {
    if (!merged[k] && dup[k]) merged[k] = dup[k]
  }

  await run(db, 'BEGIN')
  try {
    // Likes: avoid conflicts then reassign
    await run(db, 'DELETE FROM likes WHERE node_id = ? AND user_id IN (SELECT user_id FROM likes WHERE node_id = ?)', [duplicateId, canonicalId])
    await run(db, 'UPDATE likes SET node_id = ? WHERE node_id = ?', [canonicalId, duplicateId])

    // Comments
    await run(db, 'UPDATE comments SET node_id = ? WHERE node_id = ?', [canonicalId, duplicateId])

    // Edges
    await run(db, 'UPDATE edges SET from_id = ? WHERE from_id = ?', [canonicalId, duplicateId])
    await run(db, 'UPDATE edges SET to_id = ? WHERE to_id = ?', [canonicalId, duplicateId])
    // Remove self-loops and exact duplicates
    await run(db, 'DELETE FROM edges WHERE from_id = to_id')
    await run(db, 'DELETE FROM edges WHERE rowid NOT IN (SELECT MIN(rowid) FROM edges GROUP BY from_id, to_id, relation)')

    // Update canonical with merged fields
    await upsertNode({ id: canonical.id, type: canonical.type, name: merged.name, country: merged.country, tradition: merged.tradition, website: merged.website, description: merged.description, bio: merged.bio, photo_url: merged.photo_url })

    // Save alias of duplicate name
    if (dup.name && dup.name !== merged.name) {
      await run(db, 'INSERT INTO aliases (id, node_id, alias) VALUES (?,?,?)', [nanoid(), canonicalId, dup.name])
    }

    // Record version
    await run(db, 'INSERT INTO node_versions (id, node_id, editor_id, old_json, new_json, source, created_at) VALUES (?,?,?,?,?,?,?)', [nanoid(), canonicalId, approverId, JSON.stringify(canonical), JSON.stringify(merged), 'merge', Date.now()])

    // Remove duplicate node
    await run(db, 'DELETE FROM nodes WHERE id = ?', [duplicateId])

    await run(db, 'COMMIT')
  } catch (e) {
    await run(db, 'ROLLBACK')
    throw e
  }

  return merged
}
