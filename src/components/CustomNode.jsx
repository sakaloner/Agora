'use client'
import { Handle, Position } from 'reactflow'

const typeColors = {
  teacher: '#f59e0b', // amber
  monastery: '#3b82f6', // blue  
  event: '#10b981', // emerald
  retreat: '#8b5cf6' // purple
}

const typeEmojis = {
  teacher: '🧘',
  monastery: '🏛️',
  event: '✨',
  retreat: '🍃'
}

export default function CustomNode({ data, selected }) {
  const color = typeColors[data.type] || '#6b7280'
  const emoji = typeEmojis[data.type] || '📿'
  
  return (
    <div style={{
      padding: '8px 12px',
      borderRadius: '16px',
      background: selected ? color : `${color}20`,
      border: `2px solid ${color}`,
      color: selected ? 'white' : color,
      fontSize: '12px',
      fontWeight: '500',
      minWidth: '120px',
      textAlign: 'center',
      boxShadow: selected ? `0 4px 12px ${color}40` : '0 2px 6px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease'
    }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      
      <div style={{ marginBottom: '4px', fontSize: '16px' }}>
        {emoji}
      </div>
      <div style={{ 
        fontWeight: '600', 
        lineHeight: '1.2',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {data.label}
      </div>
      {data.tradition && (
        <div style={{ 
          fontSize: '10px', 
          opacity: 0.7, 
          marginTop: '2px',
          fontStyle: 'italic'
        }}>
          {data.tradition}
        </div>
      )}
      {data.likes > 0 && (
        <div style={{ 
          fontSize: '10px', 
          opacity: 0.6, 
          marginTop: '2px'
        }}>
          ❤️ {data.likes}
        </div>
      )}
    </div>
  )
}