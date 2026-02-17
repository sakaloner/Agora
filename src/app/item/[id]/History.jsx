"use client"
import { useEffect, useState } from 'react'

function diffFields(oldObj, newObj) {
  const fields = ['name','country','tradition','website','description','bio']
  const changes = []
  for (const k of fields) {
    const a = (oldObj?.[k] ?? '')
    const b = (newObj?.[k] ?? '')
    if (String(a) !== String(b)) {
      changes.push({ field: k, before: a, after: b })
    }
  }
  return changes
}

export default function History({ nodeId, isAdmin }) {
  const [items, setItems] = useState([])
  useEffect(() => {
    if (!isAdmin) return
    fetch(`/api/versions?node_id=${encodeURIComponent(nodeId)}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setItems(d.versions || []))
      .catch(() => setItems([]))
  }, [nodeId, isAdmin])

  if (!isAdmin) return null

  return (
    <div style={{marginTop:16}}>
      <h3>History</h3>
      <div className="list">
        {items.length === 0 && <div className="muted">No history yet.</div>}
        {items.map(v => {
          const changes = diffFields(v.old, v.next)
          return (
            <div key={v.id} className="card">
              <div className="muted" style={{fontSize:12}}>
                {v.editor_id} • {new Date(v.created_at).toLocaleString()} • {v.source}
              </div>
              {changes.length === 0 ? (
                <div className="muted">No field changes.</div>
              ) : (
                <div>
                  {changes.map(c => (
                    <div key={c.field} style={{display:'flex', gap:12, alignItems:'baseline', padding:'6px 0', borderTop:'1px solid #22283a'}}>
                      <div style={{width:120}} className="muted">{c.field}</div>
                      <div style={{flex:1}}>
                        <div className="muted" style={{fontSize:12}}>Before</div>
                        <div style={{whiteSpace:'pre-wrap'}}>{c.before || '—'}</div>
                      </div>
                      <div style={{flex:1}}>
                        <div className="muted" style={{fontSize:12}}>After</div>
                        <div style={{whiteSpace:'pre-wrap'}}>{c.after || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
