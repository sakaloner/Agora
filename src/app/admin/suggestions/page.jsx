import { listPendingSuggestions, applySuggestion, setSuggestionStatus } from '../../../lib/db'
import { requireAdmin } from '../../../lib/auth'

async function approve(id) {
  'use server'
  const { ok, session } = await requireAdmin()
  if (!ok) return
  await applySuggestion(id, session.user.email)
}

async function reject(id) {
  'use server'
  const { ok } = await requireAdmin()
  if (!ok) return
  await setSuggestionStatus(id, 'rejected')
}

export default async function AdminSuggestionsPage() {
  const { ok } = await requireAdmin()
  if (!ok) {
    return <div className="panel">Forbidden</div>
  }
  const items = await listPendingSuggestions()
  return (
    <div className="panel">
      <h2 style={{marginTop:0}}>Pending Suggestions</h2>
      <div className="list">
        {items.length === 0 && <div className="muted">No pending suggestions.</div>}
        {items.map(s => (
          <div key={s.id} className="card">
            <div className="muted" style={{fontSize:12}}>
              {s.user_id} → {s.node_name} ({s.node_type}) • {new Date(s.created_at).toLocaleString()}
            </div>
            <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(s.proposed, null, 2)}</pre>
            <form action={async () => { 'use server'; await approve(s.id) }}>
              <button className="button" type="submit">Approve</button>
            </form>
            <form style={{display:'inline-block', marginLeft:8}} action={async () => { 'use server'; await reject(s.id) }}>
              <button className="tab" type="submit">Reject</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
