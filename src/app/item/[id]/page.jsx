import { notFound } from 'next/navigation'
import { getNode } from '../../../lib/db'
import { isAdminEmail } from '../../../lib/auth'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../pages/api/auth/[...nextauth]'
import Comments from './comments'
import LikeButton from './LikeButton'
import SuggestEdit from './SuggestEdit'
import History from './History'
import ReportDuplicate from './ReportDuplicate'
import Relations from './Relations'
import ImageWithFallback from '../../../components/ImageWithFallback'

export const dynamic = 'force-dynamic'

export default async function ItemPage({ params }) {
  const item = await getNode(params.id)
  if (!item) return notFound()
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.email ? isAdminEmail(session.user.email) : false

  return (
    <div className="panel">
      <h2 style={{marginTop:0}}>{item.name}</h2>
      <div className="muted">{item.type} {item.tradition ? '• ' + item.tradition : ''} {item.country ? '• ' + item.country : ''}</div>
      <div style={{marginTop:8}}>
        <LikeButton nodeId={item.id} initialCount={item.like_count || 0} />
      </div>
      <div style={{marginTop:12}}>
        <ImageWithFallback 
          src={item.photo_url} 
          alt={item.name} 
          style={{maxWidth:'100%', borderRadius:12, border:'1px solid #22283a'}} 
        />
      </div>
      {item.website && (
        <p><a href={item.website} target="_blank" rel="noreferrer">Website</a></p>
      )}
      {item.description && <p>{item.description}</p>}
      {item.bio && (
        <div>
          <h3>Biography</h3>
          <p style={{whiteSpace:'pre-wrap'}}>{item.bio}</p>
        </div>
      )}

      <div style={{marginTop:16}}>
        <SuggestEdit nodeId={item.id} current={item} isAdmin={isAdmin} />
      </div>
      {isAdmin && <History nodeId={item.id} isAdmin={isAdmin} />}
      <Relations nodeId={item.id} nodeType={item.type} />
      <ReportDuplicate nodeId={item.id} nodeType={item.type} />

      <h3>Comments</h3>
      <Comments nodeId={item.id} />
    </div>
  )
}
