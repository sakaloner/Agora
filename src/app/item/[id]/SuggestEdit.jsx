"use client"
import { useEffect, useMemo, useState } from 'react'

export default function SuggestEdit({ nodeId, current, isAdmin }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(current)
  const [status, setStatus] = useState('')
  const [list, setList] = useState([])

  useEffect(() => setForm(current), [current])

  const changed = useMemo(() => {
    const result = {}
    for (const k of ['name','country','tradition','website','description','bio']) {
      if ((form[k] || '') !== (current[k] || '')) result[k] = form[k] || ''
    }
    return result
  }, [form, current])

  async function load() {
    const res = await fetch(`/api/suggestions?node_id=${encodeURIComponent(nodeId)}`, { cache: 'no-store' })
    const data = await res.json()
    setList(data.suggestions || [])
  }
  useEffect(() => { if (isAdmin) load() }, [nodeId, isAdmin])

  async function submit(e) {
    e.preventDefault()
    setStatus('')
    if (Object.keys(changed).length === 0) { setStatus('No changes to submit.'); return }
    const res = await fetch('/api/suggestions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId, ...changed })
    })
    if (res.status === 401) { setStatus('Please sign in to suggest edits.'); return }
    if (!res.ok) { setStatus('Failed to submit suggestion.'); return }
    setStatus('Suggestion sent!')
    await load()
    setOpen(false)
  }

  const set = (k) => (e) => setForm(v => ({...v, [k]: e.target.value}))

  return (
    <div>
      <button className="button" onClick={() => setOpen(v => !v)}>{open ? 'Close' : 'Suggest Edit'}</button>
      {status && <span style={{ marginLeft: 8 }} className="muted">{status}</span>}
      {open && (
        <form onSubmit={submit} className="list" style={{marginTop:12}}>
          <div>
            <label className="muted">Name</label><br/>
            <input className="input" value={form.name || ''} onChange={set('name')} />
          </div>
          <div className="row">
            <div style={{flex:1}}>
              <label className="muted">Country</label><br/>
              <input className="input" value={form.country || ''} onChange={set('country')} />
            </div>
            <div style={{flex:1}}>
              <label className="muted">Tradition</label><br/>
              <input className="input" value={form.tradition || ''} onChange={set('tradition')} />
            </div>
          </div>
          <div>
            <label className="muted">Website</label><br/>
            <input className="input" value={form.website || ''} onChange={set('website')} />
          </div>
          <div>
            <label className="muted">Short Description</label><br/>
            <input className="input" value={form.description || ''} onChange={set('description')} />
          </div>
          <div>
            <label className="muted">Biography / Details</label><br/>
            <textarea className="input" rows={6} style={{width:'100%'}} value={form.bio || ''} onChange={set('bio')} />
          </div>
          <div>
            <button className="button" type="submit">Submit Suggestion</button>
          </div>
        </form>
      )}

      {isAdmin && (
        <div style={{marginTop:16}}>
          <h4 style={{margin:0}}>Recent Suggestions</h4>
          <div className="list" style={{marginTop:8}}>
            {list.length === 0 && <div className="muted">No suggestions yet.</div>}
            {list.map(s => (
              <div key={s.id} className="card">
                <div className="muted" style={{fontSize:12}}>
                  {s.user_id} • {new Date(s.created_at).toLocaleString()} • {s.status}
                </div>
                <pre style={{margin:8, whiteSpace:'pre-wrap'}}>{JSON.stringify(s.proposed, null, 2)}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
