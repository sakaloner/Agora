import Link from 'next/link'
import ImageWithFallback from './ImageWithFallback'

export default function ItemList({ items }) {
  if (!items?.length) {
    return <div className="panel"><span className="muted">No results yet. Try adjusting filters.</span></div>
  }

  return (
    <div className="list">
      {items.map(item => (
        <div key={item.id} className="card">
          <div style={{display:'flex', gap:12}}>
            <ImageWithFallback 
              src={item.photo_url} 
              alt={item.name} 
              style={{width:56, height:56, objectFit:'cover', borderRadius:8, border:'1px solid #22283a'}} 
            />
            <div style={{flex:1}}>
          <div style={{display:'flex', justifyContent:'space-between', gap:8, alignItems:'baseline'}}>
            <h3 style={{margin:0}}>
              <Link href={`/item/${item.id}`}>{item.name}</Link>
            </h3>
            <span className="muted">{item.type}</span>
          </div>
          {(item.tradition || item.country) && (
            <div className="muted" style={{marginTop:4}}>
              {[item.tradition, item.country].filter(Boolean).join(' • ')}
            </div>
          )}
          {item.description && <p style={{marginTop:8}}>{item.description}</p>}
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            {item.website && <a href={item.website} target="_blank" rel="noreferrer">Website</a>}
            <span className="muted">{Number(item.like_count || 0)} likes</span>
          </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
