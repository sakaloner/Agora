"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddPage() {
  const router = useRouter()
  const [form, setForm] = useState({ type:'teacher', name:'', country:'', tradition:'', website:'', photo_url:'', description:'', bio:'' })
  const [error, setError] = useState('')
  const [dupes, setDupes] = useState([])
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.name?.trim()) { setError('Name is required'); return }
    setSaving(true)
    const res = await fetch('/api/items', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    if (res.status === 401) { setError('Please sign in to add items.'); setSaving(false); return }
    const data = await res.json()
    if (res.status === 409 && data.duplicate) {
      setDupes(data.matches || [])
      setError('We found similar entries. You can review them or create anyway.')
      setSaving(false)
      return
    }
    if (!res.ok) { setError(data.error || 'Failed'); setSaving(false); return }
    router.push(`/item/${data.item.id}`)
  }

  async function forceCreate() {
    setSaving(true)
    const res = await fetch('/api/items', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, force: true }) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Failed'); return }
    router.push(`/item/${data.item.id}`)
  }

  const set = (k) => (e) => setForm(v => ({...v, [k]: e.target.value}))

  return (
    <div className="panel">
      <h2 style={{marginTop:0}}>Add New Entry</h2>
      <form onSubmit={submit} className="list">
        <div>
          <label className="muted">Type</label><br/>
          <select className="input" value={form.type} onChange={set('type')}>
            {['teacher','monastery','retreat','event'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="muted">Photo URL</label><br/>
          <input className="input" value={form.photo_url} onChange={set('photo_url')} placeholder="https://..." />
        </div>
        <div>
          <label className="muted">Name</label><br/>
          <input className="input" value={form.name} onChange={set('name')} placeholder="Name" />
        </div>
        <div className="row">
          <div style={{flex:1}}>
            <label className="muted">Country</label><br/>
            <input className="input" value={form.country} onChange={set('country')} placeholder="e.g., TH" />
          </div>
          <div style={{flex:1}}>
            <label className="muted">Tradition</label><br/>
            <input className="input" value={form.tradition} onChange={set('tradition')} placeholder="e.g., Theravada" />
          </div>
        </div>
        <div>
          <label className="muted">Website</label><br/>
          <input className="input" value={form.website} onChange={set('website')} placeholder="https://..." />
        </div>
        <div>
          <label className="muted">Short Description</label><br/>
          <input className="input" value={form.description} onChange={set('description')} placeholder="One-liner" />
        </div>
        <div>
          <label className="muted">Longer Bio / Details</label><br/>
          <textarea className="input" value={form.bio} onChange={set('bio')} placeholder="Longer biography or details" rows={6} style={{width:'100%'}} />
        </div>
        {error && <div style={{color:'#ff6b6b'}}>{error}</div>}
        {dupes.length > 0 && (
          <div className="card">
            <div className="muted">Similar entries:</div>
            <ul>
              {dupes.map(d => (
                <li key={d.id}><a href={`/item/${d.id}`}>{d.name}</a> <span className="muted">({d.type}{d.country?`, ${d.country}`:''}{d.tradition?`, ${d.tradition}`:''})</span></li>
              ))}
            </ul>
            <button type="button" className="button" onClick={forceCreate} disabled={saving}>Create anyway</button>
          </div>
        )}
        <div>
          <button className="button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create'}</button>
        </div>
      </form>
    </div>
  )
}
