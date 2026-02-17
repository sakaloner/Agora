import sqlite3 from 'sqlite3'
import path from 'path'
import { nanoid } from 'nanoid'

const DB_PATH = path.join(process.cwd(), 'data.db')

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}

async function addRelationships() {
  const db = new sqlite3.Database(DB_PATH)
  
  // Get all nodes for creating relationships
  const nodes = await dbAll(db, 'SELECT id, name, type FROM nodes')
  const findNode = (name) => nodes.find(n => n.name === name)
  
  const relationships = [
    // Teacher to Teacher relationships (lineage and influence)
    { from: 'Buddha (Siddhartha Gautama)', to: 'Dalai Lama (Tenzin Gyatso)', relation: 'spiritual_ancestor_of' },
    { from: 'Buddha (Siddhartha Gautama)', to: 'Thich Nhat Hanh', relation: 'spiritual_ancestor_of' },
    { from: 'Buddha (Siddhartha Gautama)', to: 'Ajahn Chah', relation: 'spiritual_ancestor_of' },
    { from: 'Ajahn Chah', to: 'Ajahn Sumedho', relation: 'teacher_of' },
    { from: 'Ajahn Chah', to: 'Pema Chödrön', relation: 'influenced' },
    { from: 'Suzuki Roshi', to: 'Adyashanti', relation: 'influenced' },
    { from: 'Krishnamurti', to: 'Eckhart Tolle', relation: 'influenced' },
    { from: 'Ram Dass', to: 'Adyashanti', relation: 'influenced' },
    { from: 'Thich Nhat Hanh', to: 'Pema Chödrön', relation: 'contemporary_of' },
    { from: 'Jack Kornfield', to: 'Sharon Salzberg', relation: 'co_founder_with' },
    { from: 'Mingyur Rinpoche', to: 'Dalai Lama (Tenzin Gyatso)', relation: 'student_of' },
    
    // More teacher-monastery relationships
    { from: 'Suzuki Roshi', to: 'Tassajara Zen Mountain Center', relation: 'founded' },
    { from: 'Jack Kornfield', to: 'Abhayagiri Monastery', relation: 'supports' },
    { from: 'Mata Amritanandamayi', to: 'Ramana Ashram', relation: 'visits' },
    { from: 'Mingyur Rinpoche', to: 'Kopan Monastery', relation: 'teaches_at' },
    { from: 'Dalai Lama (Tenzin Gyatso)', to: 'Dzogchen Monastery', relation: 'patron_of' },
    
    // Teacher-event relationships
    { from: 'Dalai Lama (Tenzin Gyatso)', to: 'Kalachakra Initiation', relation: 'leads' },
    { from: 'Thich Nhat Hanh', to: 'Mindfulness Retreat at Plum Village', relation: 'leads' },
    { from: 'Adyashanti', to: 'Silent Retreat with Adyashanti', relation: 'leads' },
    { from: 'Adyashanti', to: 'Non-Dual Awareness Workshop', relation: 'leads' },
    { from: 'Mingyur Rinpoche', to: 'Rainbow Body Teachings', relation: 'teaches' },
    { from: 'Mingyur Rinpoche', to: 'Dzogchen Pointing-Out Instructions', relation: 'gives' },
    { from: 'Suzuki Roshi', to: 'Zen Sesshin Retreat', relation: 'established_tradition_of' },
    { from: 'Sadhguru', to: 'Yoga and Meditation Immersion', relation: 'leads' },
    { from: 'Mata Amritanandamayi', to: 'Kirtan Festival', relation: 'participates_in' },
    
    // Event-monastery relationships
    { from: 'Vesak Day Celebration', to: 'Bodhgaya', relation: 'celebrated_at' },
    { from: 'Mindfulness Retreat at Plum Village', to: 'Plum Village', relation: 'held_at' },
    { from: 'Vipassana Meditation Course', to: 'Kopan Monastery', relation: 'held_at' },
    { from: 'Medicine Buddha Empowerment', to: 'Kopan Monastery', relation: 'held_at' },
    { from: 'Forest Monastery Ordination', to: 'Wat Pah Pong', relation: 'held_at' },
    { from: 'Zen Sesshin Retreat', to: 'Tassajara Zen Mountain Center', relation: 'held_at' },
    { from: 'Yoga and Meditation Immersion', to: 'Isha Yoga Center', relation: 'held_at' },
    
    // Cross-tradition influences
    { from: 'Buddha (Siddhartha Gautama)', to: 'Vesak Day Celebration', relation: 'commemorated_in' },
    { from: 'Eckhart Tolle', to: 'Krishnamurti', relation: 'inspired_by' },
    { from: 'Ram Dass', to: 'Mata Amritanandamayi', relation: 'met' },
    { from: 'Pema Chödrön', to: 'Thich Nhat Hanh', relation: 'influenced_by' },
    
    // Historical connections
    { from: 'Potala Palace', to: 'Vesak Day Celebration', relation: 'hosts' },
    { from: 'Bodhgaya', to: 'Kalachakra Initiation', relation: 'traditional_site_for' },
  ]
  
  console.log('Adding relationships...')
  let added = 0
  
  for (const rel of relationships) {
    const fromNode = findNode(rel.from)
    const toNode = findNode(rel.to)
    
    if (fromNode && toNode && fromNode.id !== toNode.id) {
      try {
        await dbRun(db, 'INSERT OR IGNORE INTO edges (id, from_id, to_id, relation) VALUES (?,?,?,?)', 
          [nanoid(), fromNode.id, toNode.id, rel.relation])
        console.log(`✓ ${rel.from} --${rel.relation}-> ${rel.to}`)
        added++
      } catch (e) {
        console.log(`✗ Failed: ${rel.from} --${rel.relation}-> ${rel.to} (${e.message})`)
      }
    } else {
      console.log(`✗ Missing nodes: ${rel.from} -> ${rel.to}`)
    }
  }
  
  console.log(`\nAdded ${added} new relationships!`)
  
  // Show final count
  const totalRels = await dbAll(db, 'SELECT COUNT(*) as count FROM edges')
  console.log(`Total relationships in database: ${totalRels[0].count}`)
  
  db.close()
}

addRelationships().catch(console.error)