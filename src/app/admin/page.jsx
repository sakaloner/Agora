import Link from 'next/link'
import { requireAdmin } from '../../lib/auth'

export default async function AdminPage() {
  const { ok } = await requireAdmin()
  if (!ok) return <div className="panel">Forbidden</div>

  return (
    <div className="panel">
      <h1 style={{marginTop: 0}}>Admin Dashboard</h1>
      <div className="list">
        <Link href="/admin/messages" className="card" style={{textDecoration: 'none', color: 'inherit'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div>
              <strong>Contact Messages</strong>
              <div className="muted">Review messages from users</div>
            </div>
            <div style={{fontSize: '24px'}}>📧</div>
          </div>
        </Link>

        <Link href="/admin/suggestions" className="card" style={{textDecoration: 'none', color: 'inherit'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div>
              <strong>Pending Suggestions</strong>
              <div className="muted">Review and approve content suggestions</div>
            </div>
            <div style={{fontSize: '24px'}}>✏️</div>
          </div>
        </Link>

        <Link href="/admin/duplicates" className="card" style={{textDecoration: 'none', color: 'inherit'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div>
              <strong>Duplicate Reports</strong>
              <div className="muted">Manage duplicate content reports</div>
            </div>
            <div style={{fontSize: '24px'}}>🔗</div>
          </div>
        </Link>
      </div>
    </div>
  )
}