"use client"
import { useEffect, useState } from 'react'
import FilterBar from '../components/FilterBar'
import ItemList from '../components/ItemList'

export default function Page() {
  const [type, setType] = useState('teacher')
  const [q, setQ] = useState('')
  const [order, setOrder] = useState('likes')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (q) params.set('q', q)
    if (order) params.set('order', order)
    const res = await fetch(`/api/items?${params.toString()}`, { cache: 'no-store' })
    const data = await res.json()
    setItems(data.items || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [type, order])
  const onSearch = (text) => {
    setQ(text)
    setOrder(text && text.trim().length > 0 ? 'name' : 'likes')
    setTimeout(load, 0)
  }

  return (
    <div>
      <FilterBar type={type} onTypeChange={setType} q={q} onSearch={onSearch} order={order} onOrderChange={setOrder} />
      {loading ? (
        <div className="panel">Loading…</div>
      ) : (
        <ItemList items={items} />
      )}
      <div className="footer">
        Roadmap: add Google login, add graph lineage view, import/export.
      </div>
    </div>
  )
}
