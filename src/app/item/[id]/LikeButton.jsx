"use client"
import { useEffect, useState } from 'react'

export default function LikeButton({ nodeId, initialCount }) {
  const [count, setCount] = useState(initialCount || 0)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch(`/api/likes?node_id=${encodeURIComponent(nodeId)}`, { cache: 'no-store' })
    const data = await res.json()
    if (res.ok) {
      setCount(data.count || 0)
      setLiked(!!data.liked)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [nodeId])

  async function toggle() {
    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId })
    })
    if (res.status === 401) {
      alert('Please sign in to like.')
      return
    }
    const data = await res.json()
    if (res.ok) {
      setLiked(!!data.liked)
      setCount(data.count)
    }
  }

  return (
    <button className="tab" onClick={toggle} disabled={loading}>
      {liked ? '♥' : '♡'} {count}
    </button>
  )
}

