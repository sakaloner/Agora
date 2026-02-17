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

async function checkRelationships() {
  const db = new sqlite3.Database(DB_PATH)
  
  console.log('Current relationships:')
  const relationships = await dbAll(db, `
    SELECT e.from_id, e.to_id, e.relation, 
           f.name as from_name, f.type as from_type,
           t.name as to_name, t.type as to_type
    FROM edges e 
    JOIN nodes f ON f.id = e.from_id 
    JOIN nodes t ON t.id = e.to_id
  `)
  
  relationships.forEach(r => {
    console.log(`${r.from_name} (${r.from_type}) --${r.relation}-> ${r.to_name} (${r.to_type})`)
  })
  
  console.log(`\nTotal relationships: ${relationships.length}`)
  
  db.close()
}

checkRelationships().catch(console.error)