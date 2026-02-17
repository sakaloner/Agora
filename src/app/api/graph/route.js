import { ensureInitialized } from '../../../lib/db'
import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data.db')

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export async function GET(request) {
  try {
    await ensureInitialized()
    const db = new sqlite3.Database(DB_PATH)
    
    // Get all nodes
    const nodes = await dbAll(db, `
      SELECT id, name, type, tradition, country, description, photo_url,
             (SELECT COUNT(*) FROM likes l WHERE l.node_id = nodes.id) as like_count
      FROM nodes 
      WHERE deleted_at IS NULL
    `)
    
    // Get all edges with node names
    const edges = await dbAll(db, `
      SELECT e.id, e.from_id, e.to_id, e.relation,
             f.name as from_name, f.type as from_type,
             t.name as to_name, t.type as to_type
      FROM edges e
      JOIN nodes f ON f.id = e.from_id
      JOIN nodes t ON t.id = e.to_id
      WHERE f.deleted_at IS NULL AND t.deleted_at IS NULL
    `)
    
    db.close()
    
    // Transform for React Flow format
    const reactFlowNodes = nodes.map(node => ({
      id: node.id,
      data: { 
        label: node.name,
        type: node.type,
        tradition: node.tradition,
        country: node.country,
        description: node.description,
        photo_url: node.photo_url,
        likes: node.like_count || 0
      },
      position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
      type: 'custom'
    }))
    
    const reactFlowEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.from_id,
      target: edge.to_id,
      label: edge.relation,
      data: {
        relation: edge.relation,
        fromName: edge.from_name,
        toName: edge.to_name,
        fromType: edge.from_type,
        toType: edge.to_type
      }
    }))
    
    return Response.json({
      nodes: reactFlowNodes,
      edges: reactFlowEdges,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        teachers: nodes.filter(n => n.type === 'teacher').length,
        monasteries: nodes.filter(n => n.type === 'monastery').length,
        events: nodes.filter(n => n.type === 'event').length
      }
    })
    
  } catch (error) {
    console.error('Graph API error:', error)
    return Response.json({ error: 'Failed to fetch graph data' }, { status: 500 })
  }
}