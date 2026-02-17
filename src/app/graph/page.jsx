'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { buildNetworkGraph, calculatePositions } from '../../lib/forceLayout'


// SVG Tree Component
function SpiritualTree({ nodes, edges, selectedNode, onNodeClick, width, height, centerTeacherId, viewBox, onMouseDown, onWheel, onNodePosition, onNodeCenter, physicsParams, lineageDepth }) {
  // Memoize the graph and positions to prevent re-calculation on every render
  const graph = useMemo(() => {
    return buildNetworkGraph(nodes, edges, centerTeacherId, lineageDepth)
  }, [nodes, edges, centerTeacherId, lineageDepth])
  
  const positionedNodes = useMemo(() => {
    return calculatePositions(graph, width, height, physicsParams)
  }, [graph, width, height, physicsParams])
  
  // Use the network edges directly (these already connect the positioned nodes)
  const connections = graph.edges.map(edge => ({
    from: edge.source,
    to: edge.target,
    type: 'lineage'
  }))
  
  const viewBoxString = `${viewBox.x} ${viewBox.y} ${width/viewBox.scale} ${height/viewBox.scale}`
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={viewBoxString}
      style={{ background: '#0f121a', cursor: 'grab' }}
      onMouseDown={onMouseDown}
      onWheel={onWheel}
    >
      {/* Circular clip paths for profile images */}
      <defs>
        {positionedNodes.map(node => {
          const isSelected = selectedNode && selectedNode.id === node.id
          const baseRadius = node.visualRadius || 25
          const radius = isSelected ? baseRadius + 10 : baseRadius
          const imageRadius = radius - 3 // Slightly smaller than circle for border
          return (
            <clipPath key={`clip-${node.id}`} id={`circle-clip-${node.id}`}>
              <circle cx={node.x} cy={node.y} r={imageRadius} />
            </clipPath>
          )
        })}
      </defs>
      {/* Connection lines */}
      {connections.map((conn, i) => (
        <line
          key={i}
          x1={conn.from.x}
          y1={conn.from.y}
          x2={conn.to.x}
          y2={conn.to.y}
          stroke="#f59e0b"
          strokeWidth="2"
          opacity="0.7"
          strokeDasharray="none"
        />
      ))}
      
      {/* Nodes */}
      {positionedNodes.map(node => {
        const isSelected = selectedNode && selectedNode.id === node.id
        const nodeColor = node.data.type === 'teacher' ? '#f59e0b' : 
                         node.data.type === 'monastery' ? '#3b82f6' : 
                         node.data.type === 'event' ? '#10b981' : '#8b5cf6'
        
        // Use calculated visual radius, with selection boost
        const baseRadius = node.visualRadius || 25
        const radius = isSelected ? baseRadius + 10 : baseRadius
        
        return (
          <g key={node.id} style={{ cursor: 'pointer' }}>
            {/* Node circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={radius}
              fill={isSelected ? nodeColor : `${nodeColor}40`}
              stroke={nodeColor}
              strokeWidth={isSelected ? 3 : 2}
              onClick={() => {
                onNodeClick(node)
                onNodePosition?.(node.x, node.y)
              }}
              onDoubleClick={() => {
                if (node.data.type === 'teacher') {
                  onNodeCenter?.(node.id)
                }
              }}
              style={{ 
                transition: 'all 0.3s ease',
                filter: isSelected ? 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.5))' : 'none'
              }}
            />
            
            {/* Teacher photo or emoji */}
            {node.data.photo_url && node.data.type === 'teacher' ? (
              <g>
                <image
                  x={node.x - radius}
                  y={node.y - radius}
                  width={radius * 2}
                  height={radius * 2}
                  href={node.data.photo_url}
                  clipPath={`url(#circle-clip-${node.id})`}
                  style={{ pointerEvents: 'none' }}
                  onError={(e) => {
                    // If image fails to load, hide it and show emoji fallback
                    e.target.style.display = 'none'
                  }}
                />
              </g>
            ) : (
              <text
                x={node.x}
                y={node.y + 2}
                textAnchor="middle"
                fontSize={Math.max(12, radius * 0.6)} 
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {node.data.type === 'teacher' ? '🧘' :
                 node.data.type === 'monastery' ? '🏛️' :
                 node.data.type === 'event' ? '✨' : '📿'}
              </text>
            )}
            
            {/* Name label */}
            <text
              x={node.x}
              y={node.y + 50}
              textAnchor="middle"
              fontSize="11"
              fill="#fff"
              fontWeight="500"
              style={{ 
                pointerEvents: 'none', 
                userSelect: 'none',
                maxWidth: '100px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}
            >
              {node.data.label.length > 20 ? 
                node.data.label.substring(0, 18) + '...' : 
                node.data.label}
            </text>
            
            {/* Tradition */}
            {node.data.tradition && (
              <text
                x={node.x}
                y={node.y + 65}
                textAnchor="middle"
                fontSize="9"
                fill="#9ca3af"
                style={{ 
                  pointerEvents: 'none', 
                  userSelect: 'none',
                  fontStyle: 'italic'
                }}
              >
                {node.data.tradition}
              </text>
            )}
          </g>
        )
      })}
      
    </svg>
  )
}

export default function GraphPage() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState(null)
  const [centerTeacherId, setCenterTeacherId] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedNodePosition, setSelectedNodePosition] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [physicsParams, setPhysicsParams] = useState({
    repulsion: 50000,
    attraction: 0.01,
    damping: 0.85,
    iterations: 100,
    minDistance: 80,
    hierarchyStrength: 1000
  })
  const [showControls, setShowControls] = useState(false)
  const [lineageDepth, setLineageDepth] = useState(3)
  
  useEffect(() => {
    function updateDimensions() {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      setDimensions({
        width: newWidth,
        height: newHeight
      })
      // Keep viewBox centered at origin since that's where we place the graph
      setViewBox(prev => ({
        ...prev,
        x: 0,
        y: 0
      }))
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])
  
  useEffect(() => {
    async function loadGraph() {
      try {
        const res = await fetch('/api/graph')
        const data = await res.json()
        
        if (data.nodes && data.edges) {
          setNodes(data.nodes)
          setEdges(data.edges)
        }
      } catch (error) {
        console.error('Failed to load graph:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadGraph()
  }, [])
  
  const handleNodeClick = (node) => {
    setSelectedNode(node)
    // Option to re-center on clicked teacher
    // setCenterTeacherId(node.id)
  }
  
  const handleNodePosition = (svgX, svgY) => {
    // Convert SVG coordinates to screen coordinates
    const screenX = svgX - viewBox.x
    const screenY = svgY - viewBox.y
    setSelectedNodePosition({ x: screenX, y: screenY })
  }
  
  // Pan and zoom handlers
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg') {
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }
  
  const handleMouseMove = (e) => {
    if (isDragging) {
      const deltaX = (e.clientX - dragStart.x) / viewBox.scale
      const deltaY = (e.clientY - dragStart.y) / viewBox.scale
      
      setViewBox(prev => ({
        ...prev,
        x: prev.x - deltaX,
        y: prev.y - deltaY
      }))
      
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }
  
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.1, Math.min(3, viewBox.scale * delta))
    
    // Zoom towards mouse position
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const worldX = (mouseX - dimensions.width / 2) / viewBox.scale + viewBox.x
    const worldY = (mouseY - dimensions.height / 2) / viewBox.scale + viewBox.y
    
    setViewBox(prev => ({
      x: worldX - (mouseX - dimensions.width / 2) / newScale,
      y: worldY - (mouseY - dimensions.height / 2) / newScale,
      scale: newScale
    }))
  }
  
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e)
    const handleGlobalMouseUp = () => handleMouseUp()
    
    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, dragStart, viewBox.scale])
  
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0f121a',
        color: '#fff'
      }}>
        <h2>🕉️ Building the tree of wisdom...</h2>
      </div>
    )
  }
  
  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      zIndex: 1000,
      background: '#0f121a'
    }}>
      {/* Agora branding */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 20,
        color: '#fff',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        <Link 
          href="/" 
          style={{ 
            color: 'inherit', 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Agora
        </Link>
        <div style={{ 
          fontSize: '12px', 
          color: '#9ca3af', 
          fontWeight: 'normal',
          marginTop: '4px'
        }}>
          Spiritual Lineage Graph
        </div>
      </div>
      
      {/* Horizontal search bar at top center */}
      <div style={{ 
        position: 'absolute', 
        top: 20, 
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10, 
        background: 'rgba(15, 18, 26, 0.95)', 
        padding: '12px 20px', 
        borderRadius: '12px',
        border: '1px solid #22283a',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '400px',
        maxWidth: '600px'
      }}>
        <span style={{ 
          fontSize: '16px',
          color: '#fff',
          whiteSpace: 'nowrap'
        }}>
          🧘 Find Teacher:
        </span>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (e.target.value.trim()) {
                const teachers = nodes.filter(n => n.data.type === 'teacher')
                const results = teachers.filter(teacher => 
                  teacher.data.label.toLowerCase().includes(e.target.value.toLowerCase())
                ).slice(0, 5)
                setSearchResults(results)
              } else {
                setSearchResults([])
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              maxHeight: '200px',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}>
              {searchResults.map(teacher => (
                <div
                  key={teacher.id}
                  onClick={() => {
                    setCenterTeacherId(teacher.id)
                    setSelectedNode(teacher)
                    setSearchQuery(teacher.data.label)
                    setSearchResults([])
                  }}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #374151',
                    fontSize: '13px',
                    color: '#fff'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#374151'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <div style={{ fontWeight: '500' }}>{teacher.data.label}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                    {teacher.data.tradition} • {teacher.data.country}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
            Depth: {lineageDepth}
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={lineageDepth}
            onChange={(e) => setLineageDepth(parseInt(e.target.value))}
            style={{ width: '60px' }}
          />
          <button
            onClick={() => setShowControls(!showControls)}
            style={{
              padding: '8px',
              background: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Physics controls panel */}
      {showControls && (
        <div style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'rgba(15, 18, 26, 0.95)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #22283a',
          minWidth: '400px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '14px' }}>⚙️ Physics Controls</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                Repulsion ({physicsParams.repulsion})
              </label>
              <input
                type="range"
                min="10000"
                max="100000"
                step="5000"
                value={physicsParams.repulsion}
                onChange={(e) => setPhysicsParams(prev => ({ ...prev, repulsion: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                Attraction ({physicsParams.attraction})
              </label>
              <input
                type="range"
                min="0.001"
                max="0.05"
                step="0.001"
                value={physicsParams.attraction}
                onChange={(e) => setPhysicsParams(prev => ({ ...prev, attraction: parseFloat(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                Min Distance ({physicsParams.minDistance})
              </label>
              <input
                type="range"
                min="30"
                max="150"
                step="10"
                value={physicsParams.minDistance}
                onChange={(e) => setPhysicsParams(prev => ({ ...prev, minDistance: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                Damping ({physicsParams.damping})
              </label>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={physicsParams.damping}
                onChange={(e) => setPhysicsParams(prev => ({ ...prev, damping: parseFloat(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                Iterations ({physicsParams.iterations})
              </label>
              <input
                type="range"
                min="50"
                max="300"
                step="25"
                value={physicsParams.iterations}
                onChange={(e) => setPhysicsParams(prev => ({ ...prev, iterations: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                Hierarchy ({physicsParams.hierarchyStrength})
              </label>
              <input
                type="range"
                min="0"
                max="3000"
                step="100"
                value={physicsParams.hierarchyStrength}
                onChange={(e) => setPhysicsParams(prev => ({ ...prev, hierarchyStrength: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          
          <div style={{ marginTop: '12px', fontSize: '10px', color: '#6b7280' }}>
            Higher repulsion = more spread out • Higher attraction = tighter clusters • Hierarchy = teachers above students
          </div>
        </div>
      )}

      {selectedNode && (
        <div style={{ 
          position: 'absolute', 
          top: 20, 
          right: 20, 
          zIndex: 10, 
          background: 'rgba(15, 18, 26, 0.95)', 
          padding: '16px', 
          borderRadius: '12px',
          border: '1px solid #22283a',
          minWidth: '300px',
          maxWidth: '400px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
            {selectedNode.data.label}
          </h3>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
            {selectedNode.data.type} • {selectedNode.data.tradition} • {selectedNode.data.country}
          </div>
          <div style={{ fontSize: '11px', color: '#d1d5db', marginBottom: '12px', lineHeight: '1.4' }}>
            {selectedNode.data.description}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link 
              href={`/item/${selectedNode.id}`}
              style={{ 
                fontSize: '11px', 
                color: '#f59e0b',
                textDecoration: 'none'
              }}
            >
              View Details →
            </Link>
            <button 
              onClick={() => setCenterTeacherId(selectedNode.id)}
              style={{ 
                fontSize: '11px', 
                background: '#f59e0b', 
                border: 'none',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              Center on this teacher
            </button>
            <button 
              onClick={() => setSelectedNode(null)}
              style={{ 
                fontSize: '11px', 
                background: 'none', 
                border: '1px solid #374151',
                color: '#9ca3af',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      <SpiritualTree 
        nodes={nodes}
        edges={edges}
        selectedNode={selectedNode}
        onNodeClick={handleNodeClick}
        onNodePosition={handleNodePosition}
        onNodeCenter={setCenterTeacherId}
        centerTeacherId={centerTeacherId}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={viewBox}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        physicsParams={physicsParams}
        lineageDepth={lineageDepth}
      />
    </div>
  )
}