"use client"
import { useEffect, useState } from 'react'

export default function Comments({ nodeId }) {
  const [items, setItems] = useState([])
  const [content, setContent] = useState('')
  const [name, setName] = useState('')
  const [posting, setPosting] = useState(false)

  async function load() {
    const res = await fetch(`/api/comments?node_id=${encodeURIComponent(nodeId)}`, { cache: 'no-store' })
    const data = await res.json()
    setItems(data.comments || [])
  }

  useEffect(() => { load() }, [nodeId])

  async function submit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setPosting(true)
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId, authorName: name, content })
    })
    setContent('')
    setPosting(false)
    await load()
  }

  return (
    <div>
      <form onSubmit={submit} className="row" style={{gap:8, alignItems:'flex-start'}}>
        <input className="input" placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} style={{minWidth:200}} />
        <input className="input" placeholder="Write a comment…" value={content} onChange={e => setContent(e.target.value)} style={{flex:1}} />
        <button className="button" type="submit" disabled={posting}>{posting ? 'Posting…' : 'Post'}</button>
      </form>

      <div className="list" style={{marginTop:12}}>
        {items.length === 0 && <div className="muted">No comments yet.</div>}
        {items.map(c => (
          <div key={c.id} className="card">
            <div className="muted" style={{fontSize:12}}>
              {c.author_name || 'Anonymous'} • {new Date(c.created_at).toLocaleString()}
            </div>
            <div style={{marginTop:6}}>{c.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

