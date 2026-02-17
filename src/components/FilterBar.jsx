"use client"
import { useEffect, useState } from 'react'

export default function FilterBar({ type, onTypeChange, q, onSearch, order, onOrderChange }) {
  const [text, setText] = useState(q || '')

  useEffect(() => setText(q || ''), [q])
  const submit = (e) => { e?.preventDefault?.(); onSearch(text) }

  return (
    <div className="panel">
      <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
        <form onSubmit={submit} className="row" style={{flex:1, gap:8}}>
          <input className="input" style={{flex:1}} placeholder="Search names, countries, traditions…" value={text}
                 onChange={e => setText(e.target.value)} />
          <button className="button" type="submit">Search</button>
        </form>
        <div className="row" style={{gap:8, alignItems:'center'}}>
          <div className="muted">Sort</div>
          <select className="input" value={order} onChange={e => onOrderChange(e.target.value)}>
            <option value="likes">Most liked</option>
            <option value="name">Name A–Z</option>
          </select>
          <div className="tabs">
          {['teacher','monastery','retreat','event'].map(t => (
            <button key={t}
              className={`tab ${type===t?'active':''}`}
              onClick={() => onTypeChange(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
          </div>
        </div>
      </div>
    </div>
  )
}
