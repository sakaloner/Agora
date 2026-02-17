"use client"
import { useState } from 'react'

export default function QuizPage() {
  const [tradition, setTradition] = useState('')
  const [country, setCountry] = useState('')
  const [type, setType] = useState('teacher')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('type', type)
    if (tradition) params.set('q', tradition)
    if (country) params.set('q', `${tradition} ${country}`.trim())
    params.set('order', 'likes')
    const res = await fetch(`/api/items?${params.toString()}`, { cache: 'no-store' })
    const data = await res.json()
    setItems(data.items || [])
    setLoading(false)
  }

  return (
    <div className="panel">
      <h2 style={{marginTop:0}}>Find your match</h2>
      <div className="row" style={{gap:8}}>
        <div>
          <div className="muted">Looking for</div>
          <select className="input" value={type} onChange={e => setType(e.target.value)}>
            {['teacher','monastery','retreat','event'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div className="muted">Tradition</div>
          <input className="input" value={tradition} onChange={e => setTradition(e.target.value)} placeholder="Zen, Theravada, Vajrayana…" />
        </div>
        <div>
          <div className="muted">Country</div>
          <input className="input" value={country} onChange={e => setCountry(e.target.value)} placeholder="US, TH, JP…" />
        </div>
        <div style={{alignSelf:'end'}}>
          <button className="button" onClick={run} disabled={loading}>{loading ? 'Thinking…' : 'Get suggestions'}</button>
        </div>
      </div>
      <div className="list" style={{marginTop:12}}>
        {items.map(i => (
          <div key={i.id} className="card">
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <div><strong>{i.name}</strong> <span className="muted">({i.type})</span></div>
              <div className="muted">{i.like_count} likes</div>
            </div>
            <div className="muted">{[i.tradition, i.country].filter(Boolean).join(' • ')}</div>
            {i.description && <div style={{marginTop:6}}>{i.description}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

