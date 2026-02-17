// Force-Directed Layout Algorithm (Fruchterman-Reingold inspired)

// Build network graph for force-directed layout - only connected nodes
export function buildNetworkGraph(nodes, edges, centerTeacherId = null, maxDepth = 3) {
  const teachers = nodes.filter(n => n.data.type === 'teacher')
  
  // If we have a center teacher, find nodes connected within maxDepth degrees
  if (centerTeacherId) {
    const connectedToCenter = new Set([centerTeacherId])
    
    // BFS to find all connected nodes within maxDepth degrees
    for (let depth = 0; depth < maxDepth; depth++) {
      const currentLevel = new Set()
      
      edges.forEach(edge => {
        if (edge.data.relation === 'teacher_of') {
          // If source is in our connected set, add target
          if (connectedToCenter.has(edge.source) && !connectedToCenter.has(edge.target)) {
            currentLevel.add(edge.target)
          }
          // If target is in our connected set, add source
          if (connectedToCenter.has(edge.target) && !connectedToCenter.has(edge.source)) {
            currentLevel.add(edge.source)
          }
        }
      })
      
      // Add all nodes found at this level
      currentLevel.forEach(nodeId => connectedToCenter.add(nodeId))
      
      // If no new nodes found, break early
      if (currentLevel.size === 0) break
    }
    
    // Only include teachers connected to the center teacher
    const connectedTeachers = teachers.filter(n => connectedToCenter.has(n.id))
    
    return buildNetworkFromNodes(connectedTeachers, edges, centerTeacherId)
  }
  
  // Original logic - find all connected nodes
  const connectedNodeIds = new Set()
  edges.forEach(edge => {
    if (edge.data.relation === 'teacher_of') {
      connectedNodeIds.add(edge.source)
      connectedNodeIds.add(edge.target)
    }
  })
  
  const connectedTeachers = teachers.filter(n => connectedNodeIds.has(n.id))
  return buildNetworkFromNodes(connectedTeachers, edges, centerTeacherId)
}

function buildNetworkFromNodes(teachers, edges, centerTeacherId) {
  // Calculate hierarchy levels for visual sizing
  function calculateHierarchyLevel(nodeId, edges) {
    // Count how many students this teacher has (outgoing edges)
    const studentCount = edges.filter(e => e.source === nodeId && e.relation === 'teacher_of').length
    
    // Count how many teachers this person has learned from (incoming edges)  
    const teacherCount = edges.filter(e => e.target === nodeId && e.relation === 'teacher_of').length
    
    // Higher level = more students, fewer teachers (more senior)
    return studentCount - teacherCount
  }

  // Initialize nodes with physics properties and hierarchy info
  const networkNodes = teachers.map((n, index) => {
    const hierarchyLevel = calculateHierarchyLevel(n.id, edges)
    
    return {
      ...n,
      // Better initial distribution - spread nodes in a larger area
      x: Math.random() * 400 + 200, // Random between 200-600 (smaller for connected nodes)
      y: Math.random() * 400 + 200, // Random between 200-600
      
      // Physics properties
      vx: 0, // velocity x
      vy: 0, // velocity y
      fx: null, // fixed x (null = not fixed)
      fy: null, // fixed y
      
      // Visual properties
      isCenterTeacher: n.id === centerTeacherId,
      hierarchyLevel: hierarchyLevel,
      // Visual size based on hierarchy (senior teachers bigger)
      visualRadius: Math.max(15, 25 + hierarchyLevel * 3) // Base 25, +3 per level above
    }
  })
  
  // If we have a center teacher, position them in the middle initially
  const centerNode = networkNodes.find(n => n.id === centerTeacherId)
  if (centerNode) {
    centerNode.x = 400 // Screen center-ish
    centerNode.y = 300
  }
  
  // Process edges - keep all relationships (multiple teachers allowed!)
  const networkEdges = []
  edges.forEach(edge => {
    const sourceNode = networkNodes.find(n => n.id === edge.source)
    const targetNode = networkNodes.find(n => n.id === edge.target)
    
    if (sourceNode && targetNode && edge.data.relation === 'teacher_of') {
      networkEdges.push({
        source: sourceNode,
        target: targetNode,
        relation: edge.data.relation
      })
    }
  })
  
  return { nodes: networkNodes, edges: networkEdges }
}

export function forceDirectedLayout(graph, width, height, params = {}) {
  const { nodes, edges } = graph
  
  // Adjust repulsion based on node count (more nodes = less individual repulsion)
  const nodeCountFactor = Math.max(0.3, 1 - (nodes.length / 200))
  
  // Physics constants - these control the behavior
  const REPULSION_STRENGTH = (params.repulsion || 50000) * nodeCountFactor
  const ATTRACTION_STRENGTH = params.attraction || 0.01 // How strongly connected nodes attract
  const DAMPING = params.damping || 0.85 // Friction factor (0.9 = 90% of velocity kept each frame)
  const MIN_DISTANCE = params.minDistance || 80 // Minimum distance between nodes
  const HIERARCHY_STRENGTH = params.hierarchyStrength || 1000 // How strongly to enforce vertical hierarchy
  const iterations = params.iterations || 100
  
  // Run simulation
  for (let iteration = 0; iteration < iterations; iteration++) {
    // 1. Calculate repulsive forces (every node pushes every other node)
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i]
      
      // Reset forces
      let fx = 0, fy = 0
      
      // Repulsion from all other nodes
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue
        const nodeB = nodes[j]
        
        // Calculate distance
        const dx = nodeA.x - nodeB.x
        const dy = nodeA.y - nodeB.y
        const distance = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DISTANCE)
        
        // Repulsive force (inverse square law, like magnets)
        const force = REPULSION_STRENGTH / (distance * distance)
        fx += (dx / distance) * force
        fy += (dy / distance) * force
      }
      
      // Store repulsive forces
      nodeA.fx_repulsion = fx
      nodeA.fy_repulsion = fy
    }
    
    // 2. Calculate attractive forces (connected nodes pull each other)
    for (const edge of edges) {
      const source = edge.source
      const target = edge.target
      
      // Calculate distance
      const dx = target.x - source.x  
      const dy = target.y - source.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > 0) {
        // Attractive force (like springs - Hooke's law)
        const force = distance * ATTRACTION_STRENGTH
        const fx = (dx / distance) * force
        const fy = (dy / distance) * force
        
        // Apply equal and opposite forces
        source.vx += fx
        source.vy += fy
        target.vx -= fx  
        target.vy -= fy
      }
    }
    
    // 3. Apply hierarchical forces (teachers above students)
    for (const edge of edges) {
      const teacher = edge.source  // source is teacher
      const student = edge.target  // target is student
      
      // Vertical separation force - teacher should be above student
      const verticalDistance = student.y - teacher.y
      const idealSeparation = 100 // Ideal vertical distance between teacher and student
      
      if (verticalDistance < idealSeparation) {
        // Student is too high relative to teacher - push them apart vertically
        const correction = (idealSeparation - verticalDistance) * 0.01
        
        teacher.vy -= correction * HIERARCHY_STRENGTH * 0.001 // Push teacher up
        student.vy += correction * HIERARCHY_STRENGTH * 0.001 // Push student down
      }
    }
    
    // 4. Apply forces and update positions
    for (const node of nodes) {
      // Skip if node is fixed (center teacher can be pinned)
      if (node.fx !== null && node.fy !== null) continue
      
      // Add repulsive forces to velocity
      node.vx += node.fx_repulsion * 0.001 // Scale down repulsion
      node.vy += node.fy_repulsion * 0.001
      
      // Apply damping (friction)
      node.vx *= DAMPING
      node.vy *= DAMPING
      
      // Update position based on velocity
      node.x += node.vx
      node.y += node.vy
      
      // Enforce minimum distance after position update
      for (let j = 0; j < nodes.length; j++) {
        if (nodes[j] === node) continue
        const otherNode = nodes[j]
        
        const dx = node.x - otherNode.x
        const dy = node.y - otherNode.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < MIN_DISTANCE && distance > 0) {
          const pushDistance = (MIN_DISTANCE - distance) / 2
          const pushX = (dx / distance) * pushDistance
          const pushY = (dy / distance) * pushDistance
          
          node.x += pushX
          node.y += pushY
          otherNode.x -= pushX
          otherNode.y -= pushY
        }
      }
      
      // Keep nodes within bounds (with some padding)
      const padding = 100
      node.x = Math.max(padding, Math.min(width - padding, node.x))
      node.y = Math.max(padding, Math.min(height - padding, node.y))
    }
    
    // 5. Cool down the system (reduce forces over time)
    const coolingFactor = 1 - (iteration / iterations)
    // Forces naturally get smaller as nodes settle into equilibrium
  }
  
  return nodes
}

// Apply force-directed layout
export function calculatePositions(graph, width, height, physicsParams) {
  // Run the physics simulation
  const positionedNodes = forceDirectedLayout(graph, width, height, physicsParams)
  
  return positionedNodes
}