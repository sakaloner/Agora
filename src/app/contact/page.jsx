"use client"
import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)

  const set = (k) => (e) => setForm(v => ({ ...v, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setStatus('')
    setSending(true)
    const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setSending(false)
    if (!res.ok) { setStatus(data.error || 'Failed to send'); return }
    setStatus('Message sent. Thank you!')
    setForm({ name:'', email:'', message:'' })
  }

  return (
    <div className="panel">
      <h2 style={{marginTop:0}}>Contact</h2>
      <form onSubmit={submit} className="list">
        <div>
          <label className="muted">Name</label><br/>
          <input className="input" value={form.name} onChange={set('name')} placeholder="Your name" />
        </div>
        <div>
          <label className="muted">Email</label><br/>
          <input className="input" value={form.email} onChange={set('email')} placeholder="you@example.com" />
        </div>
        <div>
          <label className="muted">Message</label><br/>
          <textarea className="input" rows={6} style={{width:'100%'}} value={form.message} onChange={set('message')} placeholder="How can we help?" />
        </div>
        {status && <div className="muted">{status}</div>}
        <div>
          <button className="button" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send'}</button>
        </div>
      </form>
    </div>
  )
}

