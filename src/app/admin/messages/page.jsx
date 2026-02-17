import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../pages/api/auth/[...nextauth]'
import { isAdminEmail } from '../../../lib/auth'

async function fetchMessages() {
  'use server'
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/contact`, { cache: 'no-store' })
  const data = await res.json()
  return data.messages || []
}

export default async function AdminMessages() {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email || '')) return <div className="panel">Forbidden</div>
  const messages = await fetchMessages()
  return (
    <div className="panel">
      <h2 style={{marginTop:0}}>Contact Messages</h2>
      <div className="list">
        {messages.length === 0 && <div className="muted">No messages yet.</div>}
        {messages.map(m => (
          <div key={m.id} className="card">
            <div className="muted" style={{fontSize:12}}>
              {m.name || 'Anonymous'} {m.email ? `• ${m.email}` : ''} • {new Date(m.created_at).toLocaleString()}
            </div>
            <div style={{marginTop:6, whiteSpace:'pre-wrap'}}>{m.message}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

