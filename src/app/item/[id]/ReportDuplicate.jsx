"use client"
import { useEffect, useState } from 'react'

export default function ReportDuplicate({ nodeId, nodeType }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function search() {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const res = await fetch(`/api/items?type=${encodeURIComponent(nodeType)}&q=${encodeURIComponent(q)}&limit=10`)
    const data = await res.json()
    setResults((data.items || []).filter(i => i.id !== nodeId))
    setLoading(false)
  }

  async function report(targetId) {
    setStatus('')
    const res = await fetch('/api/duplicates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceId: nodeId, targetId }) })
    if (res.status === 401) { setStatus('Please sign in to report duplicates.'); return }
    const data = await res.json()
    if (!res.ok) { setStatus(data.error || 'Failed to report.'); return }
    setStatus('Reported! An admin will review.')
  }

  useEffect(() => { const t = setTimeout(search, 300); return () => clearTimeout(t) }, [q])

  return (
    <div className="panel" style={{marginTop:16}}>
      <h3 style={{marginTop:0}}>Report Duplicate</h3>
      <div className="row" style={{gap:8}}>
        <input className="input" style={{flex:1}} placeholder={`Search ${nodeType}s to mark as canonical…`} value={q} onChange={e => setQ(e.target.value)} />
        <button className="button" onClick={search} disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
      </div>
      {status && <div className="muted" style={{marginTop:8}}>{status}</div>}
      <div className="list" style={{marginTop:8}}>
        {results.map(r => (
          <div key={r.id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <div><strong>{r.name}</strong> <span className="muted">({r.type}{r.country?`, ${r.country}`:''}{r.tradition?`, ${r.tradition}`:''})</span></div>
            </div>
            <button className="tab" onClick={() => report(r.id)}>Mark this as Canonical</button>
          </div>
        ))}
      </div>
    </div>
  )
}

