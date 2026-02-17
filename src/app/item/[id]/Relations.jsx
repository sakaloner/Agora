"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Relations({ nodeId, nodeType }) {
  const [edges, setEdges] = useState([])
  const [relatedNodes, setRelatedNodes] = useState({})
  const [q, setQ] = useState('')
  const [search, setSearch] = useState([])
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState({ show: false, message: '', type: 'success' })
  const [savingId, setSavingId] = useState(null)

  async function loadEdges() {
    const res = await fetch(`/api/edges?node_id=${encodeURIComponent(nodeId)}`, { cache: 'no-store' })
    const data = await res.json()
    const edges = data.edges || []
    setEdges(edges)
    
    // Get unique node IDs that we need to fetch
    const nodeIds = [...new Set(edges.map(e => e.from_id === nodeId ? e.to_id : e.from_id))]
    
    // Fetch node details
    const nodePromises = nodeIds.map(id => 
      fetch(`/api/items/${id}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => ({ id, node: data.item }))
        .catch(() => ({ id, node: null }))
    )
    
    const nodeResults = await Promise.all(nodePromises)
    const nodeMap = {}
    nodeResults.forEach(({ id, node }) => {
      if (node) nodeMap[id] = node
    })
    setRelatedNodes(nodeMap)
  }

  async function searchNodes() {
    if (!q.trim()) { setSearch([]); return }
    setLoading(true)
    const res = await fetch(`/api/items?q=${encodeURIComponent(q)}&limit=8`)
    const data = await res.json()
    setSearch((data.items || []).filter(i => i.id !== nodeId))
    setLoading(false)
  }

  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type })
    setTimeout(() => setFeedback({ show: false, message: '', type: 'success' }), 3000)
  }

  async function addEdge(fromId, toId, relation, targetName) {
    setSavingId(`${fromId}-${toId}-${relation}`)
    try {
      const res = await fetch('/api/edges', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ from_id: fromId, to_id: toId, relation }) 
      })
      
      if (res.status === 401) { 
        showFeedback('Please sign in to add relationships', 'error')
        return 
      }
      
      const data = await res.json()
      
      if (!res.ok) { 
        showFeedback(data.error || `Failed to add relationship`, 'error')
        return 
      }
      
      // Clear search after successful add
      setQ('')
      setSearch([])
      
      const relationText = relation === 'teacher_of' ? 'teacher' : relation === 'peer_of' ? 'peer' : 'affiliation'
      showFeedback(`✅ Added ${targetName} as ${relationText}`, 'success')
      
      await loadEdges()
    } catch (error) {
      console.error('Error adding edge:', error)
      showFeedback('Error adding relationship', 'error')
    } finally {
      setSavingId(null)
    }
  }

  useEffect(() => { loadEdges() }, [nodeId])
  useEffect(() => { const t = setTimeout(searchNodes, 300); return () => clearTimeout(t) }, [q])

  const outgoing = edges.filter(e => e.from_id === nodeId)
  const incoming = edges.filter(e => e.to_id === nodeId)

  // Categorize relationships
  const teachers = incoming
    .filter(e => e.relation === 'teacher_of')
    .map(e => relatedNodes[e.from_id])
    .filter(Boolean)
    
  const students = outgoing
    .filter(e => e.relation === 'teacher_of')
    .map(e => relatedNodes[e.to_id])
    .filter(Boolean)
    
  const peers = [...incoming, ...outgoing]
    .filter(e => e.relation === 'peer_of')
    .map(e => relatedNodes[e.from_id === nodeId ? e.to_id : e.from_id])
    .filter(Boolean)
    
  const affiliations = [...incoming, ...outgoing]
    .filter(e => e.relation === 'affiliated_with')
    .map(e => relatedNodes[e.from_id === nodeId ? e.to_id : e.from_id])
    .filter(Boolean)
  
  return (
    <>
      {/* Feedback Toast */}
      {feedback.show && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000,
          background: feedback.type === 'error' ? '#ff6b6b' : '#7acb7a',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontWeight: '500',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transform: 'translateX(0)',
          transition: 'all 0.3s ease-out'
        }}>
          {feedback.message}
        </div>
      )}
      
      <div className="panel" style={{marginTop:16}}>
        <h3 style={{marginTop:0}}>Relationships</h3>
      
      {/* Add new relationships */}
      <div style={{marginBottom:16}}>
        <div className="muted" style={{fontSize:12, marginBottom:8}}>Add new connection:</div>
        <div className="row" style={{gap:8, alignItems:'center'}}>
          <input className="input" style={{flex:1}} placeholder="Search teachers, monasteries, retreats…" value={q} onChange={e => setQ(e.target.value)} />
          <button className="button" onClick={searchNodes} disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
        </div>
        {search.length > 0 && (
          <div className="list" style={{marginTop:8}}>
            {search.map(s => (
              <div key={s.id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px'}}>
                <div>
                  <strong>{s.name}</strong> 
                  <span className="muted" style={{marginLeft:8}}>({s.type}{s.country?`, ${s.country}`:''}{s.tradition?`, ${s.tradition}`:''})</span>
                </div>
                <div className="row" style={{gap:6}}>
                  <button 
                    className="tab" 
                    style={{fontSize:11, padding:'4px 8px', opacity: savingId === `${s.id}-${nodeId}-teacher_of` ? 0.6 : 1}} 
                    onClick={() => addEdge(s.id, nodeId, 'teacher_of', s.name)}
                    disabled={savingId === `${s.id}-${nodeId}-teacher_of`}
                  >
                    {savingId === `${s.id}-${nodeId}-teacher_of` ? '⏳' : 'Teacher'}
                  </button>
                  <button 
                    className="tab" 
                    style={{fontSize:11, padding:'4px 8px', opacity: savingId === `${nodeId}-${s.id}-teacher_of` ? 0.6 : 1}} 
                    onClick={() => addEdge(nodeId, s.id, 'teacher_of', s.name)}
                    disabled={savingId === `${nodeId}-${s.id}-teacher_of`}
                  >
                    {savingId === `${nodeId}-${s.id}-teacher_of` ? '⏳' : 'Student'}
                  </button>
                  <button 
                    className="tab" 
                    style={{fontSize:11, padding:'4px 8px', opacity: savingId === `${nodeId}-${s.id}-peer_of` ? 0.6 : 1}} 
                    onClick={() => addEdge(nodeId, s.id, 'peer_of', s.name)}
                    disabled={savingId === `${nodeId}-${s.id}-peer_of`}
                  >
                    {savingId === `${nodeId}-${s.id}-peer_of` ? '⏳' : 'Peer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Display existing relationships */}
      <div style={{borderTop:'1px solid #22283a', paddingTop:16}}>
        {teachers.length > 0 && (
          <div style={{marginBottom:12}}>
            <div className="muted" style={{fontSize:12, fontWeight:'bold', marginBottom:4}}>Teachers:</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {teachers.map(teacher => (
                <Link key={teacher.id} href={`/item/${teacher.id}`} style={{color:'var(--accent)', textDecoration:'none'}}>
                  {teacher.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {students.length > 0 && (
          <div style={{marginBottom:12}}>
            <div className="muted" style={{fontSize:12, fontWeight:'bold', marginBottom:4}}>Students:</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {students.map(student => (
                <Link key={student.id} href={`/item/${student.id}`} style={{color:'var(--accent)', textDecoration:'none'}}>
                  {student.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {peers.length > 0 && (
          <div style={{marginBottom:12}}>
            <div className="muted" style={{fontSize:12, fontWeight:'bold', marginBottom:4}}>Peers:</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {peers.map(peer => (
                <Link key={peer.id} href={`/item/${peer.id}`} style={{color:'var(--accent)', textDecoration:'none'}}>
                  {peer.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {affiliations.length > 0 && (
          <div style={{marginBottom:12}}>
            <div className="muted" style={{fontSize:12, fontWeight:'bold', marginBottom:4}}>Affiliations:</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {affiliations.map(affiliation => (
                <Link key={affiliation.id} href={`/item/${affiliation.id}`} style={{color:'var(--accent)', textDecoration:'none'}}>
                  {affiliation.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {teachers.length === 0 && students.length === 0 && peers.length === 0 && affiliations.length === 0 && (
          <div className="muted">No relationships yet.</div>
        )}
        </div>
      </div>
    </>
  )
}