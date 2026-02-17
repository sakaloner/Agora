import { listPendingDuplicates, mergeNodes, setDuplicateReportStatus } from '../../../lib/db'
import { requireAdmin } from '../../../lib/auth'

async function doMerge(reportId, canonicalId, duplicateId) {
  'use server'
  const { ok, session } = await requireAdmin()
  if (!ok) return
  await mergeNodes(canonicalId, duplicateId, session.user.email)
  await setDuplicateReportStatus(reportId, 'approved')
}

async function rejectReport(reportId) {
  'use server'
  const { ok } = await requireAdmin()
  if (!ok) return
  await setDuplicateReportStatus(reportId, 'rejected')
}

export default async function AdminDuplicatesPage() {
  const { ok } = await requireAdmin()
  if (!ok) return <div className="panel">Forbidden</div>
  const items = await listPendingDuplicates()
  return (
    <div className="panel">
      <h2 style={{marginTop:0}}>Duplicate Reports</h2>
      <div className="list">
        {items.length === 0 && <div className="muted">No pending reports.</div>}
        {items.map(r => (
          <div key={r.id} className="card">
            <div className="muted" style={{fontSize:12}}>
              {r.reporter_id} • {new Date(r.created_at).toLocaleString()}
            </div>
            <div>
              Mark <strong>{r.source_name}</strong> ({r.source_type}) as duplicate of <strong>{r.target_name}</strong> ({r.target_type})
            </div>
            {r.reason && <div style={{marginTop:6}} className="muted">Reason: {r.reason}</div>}
            <div className="row" style={{marginTop:8}}>
              <form action={async () => { 'use server'; await doMerge(r.id, r.target_id, r.source_id) }}>
                <button className="button" type="submit">Merge</button>
              </form>
              <form action={async () => { 'use server'; await rejectReport(r.id) }}>
                <button className="tab" type="submit">Reject</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

