import { useState, useEffect, useCallback, useRef } from 'react'
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'
import {
  GitBranch, Users, Heart, User, Maximize2, RotateCcw,
  Grid3X3, LayoutGrid, BoxSelect, AlignCenterHorizontal,
  AlignCenterVertical, ChevronDown, FoldVertical, UnfoldVertical,
} from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

const NODE_W = 180
const V_GAP = 130
const H_GAP = 25
const SNAP_GRID = [20, 20]

// ── Person Node ─────────────────────────────────────────────
function PersonNode({ data, selected }) {
  const { name, photoURL, gender, isDeceased, role, spouse, isGrandparent, isGrouped } = data
  const borderColor = isGrandparent ? '#B8976A' : gender === 'F' ? '#B8654A' : '#6B9080'
  const bgColor = isGrandparent ? '#FFFFFF' : '#F1F5F9'

  return (
    <div
      className="rounded-xl shadow-md border-2 px-3 py-2 text-center relative"
      style={{
        backgroundColor: bgColor,
        borderColor: selected ? '#3B82F6' : borderColor,
        width: NODE_W,
        minWidth: NODE_W,
        opacity: isDeceased ? 0.75 : 1,
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.3), 0 4px 12px rgba(0,0,0,0.1)' : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        {photoURL ? (
          <img src={photoURL} alt={name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" style={{ border: `2px solid ${borderColor}` }} />
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${borderColor}20` }}>
            <User className="w-5 h-5" style={{ color: borderColor }} />
          </div>
        )}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-bold leading-tight truncate" style={{ color: '#0F172A' }}>{name}</p>
          {role && <p className="text-[11px] text-[#6B9080] font-medium">{role}</p>}
          {isDeceased && <p className="text-[11px] text-[#B8976A] italic">En memoria</p>}
        </div>
      </div>
      {spouse && (
        <div className="mt-1.5 pt-1.5 border-t flex items-center gap-1.5" style={{ borderColor: `${borderColor}30` }}>
          <Heart className="w-3 h-3 text-[#B8654A] flex-shrink-0" />
          {spouse.photoURL ? (
            <img src={spouse.photoURL} alt={spouse.name} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#B8654A15' }}>
              <User className="w-3 h-3 text-[#B8654A]" />
            </div>
          )}
          <p className="text-[11px] truncate" style={{ color: '#0F172A' }}>{typeof spouse === 'object' ? spouse.name : spouse}</p>
        </div>
      )}
      <Handle type="target" position={Position.Top} style={{ background: selected ? '#3B82F6' : borderColor, width: 8, height: 8, border: '2px solid white' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: selected ? '#3B82F6' : borderColor, width: 8, height: 8, border: '2px solid white' }} />
      {isGrouped && (
        <div
          className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
          style={{ backgroundColor: '#8B5CF6', border: '2px solid white' }}
        >
          G
        </div>
      )}
    </div>
  )
}

const nodeTypes = { person: PersonNode }

// ── Tree layout helpers ─────────────────────────────────────
function subtreeWidth(person) {
  const kids = person.children || []
  if (kids.length === 0) return NODE_W + H_GAP
  return kids.reduce((sum, c) => sum + subtreeWidth(c), 0)
}

function buildTree(members, grandparentsData) {
  const nodes = []
  const edges = []
  let nodeId = 0
  const getId = () => `n${nodeId++}`

  const edgeStyles = [
    { stroke: '#B8654A', strokeWidth: 2.5 },
    { stroke: '#6B9080', strokeWidth: 2 },
    { stroke: '#B8976A', strokeWidth: 1.5 },
    { stroke: '#0F172A', strokeWidth: 1 },
  ]

  function placeSubtree(person, x, y, depth, parentId) {
    const id = getId()
    const style = edgeStyles[Math.min(depth, edgeStyles.length - 1)]

    nodes.push({
      id,
      type: 'person',
      position: { x, y },
      data: {
        name: person.fullName || person.name,
        photoURL: person.photoURL,
        gender: person.gender,
        isDeceased: !!person.deathDate,
        role: person.role,
        isGrandparent: depth === 0,
        spouse: person.spouse && typeof person.spouse === 'object' ? person.spouse : null,
      },
    })

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: 'smoothstep',
        style: { stroke: `${style.stroke}90`, strokeWidth: style.strokeWidth },
      })
    }

    const kids = person.children || []
    if (kids.length > 0) {
      const totalW = kids.reduce((s, c) => s + subtreeWidth(c), 0)
      let cx = x - totalW / 2 + NODE_W / 2
      kids.forEach((child) => {
        const childW = subtreeWidth(child)
        const childX = cx + childW / 2 - NODE_W / 2
        placeSubtree(child, childX, y + V_GAP, depth + 1, id)
        cx += childW
      })
    }
  }

  const gf = grandparentsData?.grandfather
  const gm = grandparentsData?.grandmother
  const totalWidth = members.reduce((s, m) => s + subtreeWidth(m), 0)
  const childrenY = V_GAP

  const gpId = getId()
  nodes.push({
    id: gpId,
    type: 'person',
    position: { x: 0, y: 0 },
    data: {
      name: gf?.fullName || gf?.name || 'Abuelos',
      photoURL: gf?.photoURL,
      gender: 'M',
      isGrandparent: true,
      role: gf?.role || 'Patriarca',
      spouse: gm ? { name: gm.fullName || gm.name, photoURL: gm.photoURL } : null,
    },
  })

  let curX = -totalWidth / 2 + NODE_W / 2
  members.forEach((member) => {
    const mWidth = subtreeWidth(member)
    const mX = curX + mWidth / 2 - NODE_W / 2
    placeSubtree(member, mX, childrenY, 1, gpId)
    curX += mWidth
  })

  const level1 = nodes.filter(n => n.position.y === childrenY)
  if (level1.length > 0) {
    const minX = Math.min(...level1.map(n => n.position.x))
    const maxX = Math.max(...level1.map(n => n.position.x))
    nodes[0].position.x = (minX + maxX) / 2
  }

  return { nodes, edges }
}

// ── Toolbar Button ──────────────────────────────────────────
function ToolBtn({ onClick, active, icon: Icon, label, color = '#0F172A', tip }) {
  return (
    <button
      onClick={onClick}
      title={tip || label}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg shadow-md text-[11px] font-medium transition ${
        active ? 'text-white' : 'bg-white/5 hover:bg-white'
      }`}
      style={active ? { backgroundColor: color, color: 'white' } : { color }}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// ── Main Component ──────────────────────────────────────────
export default function InteractiveTree() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [tool, setTool] = useState('move') // 'move' | 'select'
  const [groups, setGroups] = useState([]) // array of Set<nodeId>
  const edgesRef = useRef(edges)
  edgesRef.current = edges
  const nodesRef = useRef(nodes)
  nodesRef.current = nodes
  const groupsRef = useRef(groups)
  groupsRef.current = groups

  useEffect(() => { loadTree() }, [])

  const sortByBirth = (arr) => {
    if (!arr) return arr
    arr.sort((a, b) => {
      if (!a.birthDate && !b.birthDate) return 0
      if (!a.birthDate) return 1
      if (!b.birthDate) return -1
      return a.birthDate.localeCompare(b.birthDate)
    })
    arr.forEach(p => { if (p.children) sortByBirth(p.children) })
    return arr
  }

  const POSITIONS_KEY = 'interactive-tree-positions'

  const savePositions = useCallback((nds) => {
    try {
      const pos = {}
      nds.forEach(n => { pos[n.id] = n.position })
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(pos))
    } catch (e) {}
  }, [])

  const loadTree = async (reset) => {
    const [members, gp] = await Promise.all([getFamilyMembers(), getGrandparents()])
    sortByBirth(members)
    if (members.length > 0 || gp) {
      const { nodes: n, edges: e } = buildTree(members, gp)
      // Restore saved positions unless reset
      if (!reset) {
        try {
          const saved = JSON.parse(localStorage.getItem(POSITIONS_KEY) || '{}')
          if (Object.keys(saved).length > 0) {
            n.forEach(node => {
              if (saved[node.id]) node.position = saved[node.id]
            })
          }
        } catch (e) {}
      } else {
        localStorage.removeItem(POSITIONS_KEY)
      }
      setNodes(n)
      setEdges(e)
    }
    setGroups([])
    setLoading(false)
  }

  // ── Group: selected nodes become a group that moves together ─
  const groupSelected = useCallback(() => {
    const selectedIds = nodes.filter(n => n.selected).map(n => n.id)
    if (selectedIds.length < 2) return
    const newGroup = new Set(selectedIds)
    // Remove any existing groups that overlap with this new one
    setGroups(prev => {
      const filtered = prev.filter(g => {
        for (const id of selectedIds) { if (g.has(id)) return false }
        return true
      })
      return [...filtered, newGroup]
    })
    // Mark grouped nodes visually
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, isGrouped: newGroup.has(n.id) || groups.some(g => g.has(n.id)) },
      selected: false,
    })))
  }, [nodes, groups, setNodes])

  const ungroupSelected = useCallback(() => {
    const selectedIds = new Set(nodes.filter(n => n.selected).map(n => n.id))
    if (selectedIds.size === 0) {
      // Ungroup all
      setGroups([])
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isGrouped: false } })))
      return
    }
    setGroups(prev => {
      const next = prev.filter(g => {
        for (const id of selectedIds) { if (g.has(id)) return false }
        return true
      })
      // Update visual
      const stillGrouped = new Set()
      next.forEach(g => g.forEach(id => stillGrouped.add(id)))
      setNodes(nds => nds.map(n => ({
        ...n,
        data: { ...n.data, isGrouped: stillGrouped.has(n.id) },
        selected: false,
      })))
      return next
    })
  }, [nodes, setNodes])

  // ── Intercept node changes to move grouped nodes together ─
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes)

    const posChanges = changes.filter(c => c.type === 'position' && c.position)
    if (posChanges.length === 0) return

    // Save positions after drag ends
    const dragEnd = changes.some(c => c.type === 'position' && c.dragging === false)
    if (dragEnd) {
      setTimeout(() => savePositions(nodesRef.current), 100)
    }

    // Group movement
    if (groupsRef.current.length === 0) return
    posChanges.forEach(change => {
      const group = groupsRef.current.find(g => g.has(change.id))
      if (!group) return
      const prevNode = nodesRef.current.find(n => n.id === change.id)
      if (!prevNode) return
      const dx = change.position.x - prevNode.position.x
      const dy = change.position.y - prevNode.position.y
      if (dx === 0 && dy === 0) return
      setNodes(nds => nds.map(n => {
        if (n.id !== change.id && group.has(n.id)) {
          return { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }
        }
        return n
      }))
    })
  }, [onNodesChange, setNodes, savePositions])

  // ── Select entire branch (node + all descendants) ───────
  const selectBranch = useCallback((nodeId) => {
    const descendants = new Set()
    const queue = [nodeId]
    while (queue.length > 0) {
      const current = queue.shift()
      descendants.add(current)
      edgesRef.current.forEach(e => {
        if (e.source === current && !descendants.has(e.target)) {
          queue.push(e.target)
        }
      })
    }
    setNodes(nds => nds.map(n => ({ ...n, selected: descendants.has(n.id) })))
  }, [setNodes])

  // ── Align selected nodes ────────────────────────────────
  const alignSelectedH = useCallback(() => {
    const selected = nodes.filter(n => n.selected)
    if (selected.length < 2) return
    const avgY = selected.reduce((s, n) => s + n.position.y, 0) / selected.length
    const snappedY = snapToGrid ? Math.round(avgY / SNAP_GRID[1]) * SNAP_GRID[1] : avgY
    const ids = new Set(selected.map(n => n.id))
    setNodes(nds => nds.map(n => ids.has(n.id) ? { ...n, position: { ...n.position, y: snappedY } } : n))
  }, [nodes, setNodes, snapToGrid])

  const alignSelectedV = useCallback(() => {
    const selected = nodes.filter(n => n.selected)
    if (selected.length < 2) return
    const avgX = selected.reduce((s, n) => s + n.position.x, 0) / selected.length
    const snappedX = snapToGrid ? Math.round(avgX / SNAP_GRID[0]) * SNAP_GRID[0] : avgX
    const ids = new Set(selected.map(n => n.id))
    setNodes(nds => nds.map(n => ids.has(n.id) ? { ...n, position: { ...n.position, x: snappedX } } : n))
  }, [nodes, setNodes, snapToGrid])

  // ── Distribute evenly ───────────────────────────────────
  const distributeSelectedH = useCallback(() => {
    const selected = nodes.filter(n => n.selected)
    if (selected.length < 3) return
    const sorted = [...selected].sort((a, b) => a.position.x - b.position.x)
    const minX = sorted[0].position.x
    const maxX = sorted[sorted.length - 1].position.x
    const gap = (maxX - minX) / (sorted.length - 1)
    const idMap = {}
    sorted.forEach((n, i) => { idMap[n.id] = minX + i * gap })
    setNodes(nds => nds.map(n => idMap[n.id] !== undefined ? { ...n, position: { ...n.position, x: idMap[n.id] } } : n))
  }, [nodes, setNodes])

  // ── Select all ──────────────────────────────────────────
  const selectAll = useCallback(() => {
    setNodes(nds => nds.map(n => ({ ...n, selected: true })))
  }, [setNodes])

  const deselectAll = useCallback(() => {
    setNodes(nds => nds.map(n => ({ ...n, selected: false })))
  }, [setNodes])

  // ── Node click: select branch with double-click ─────────
  const onNodeDoubleClick = useCallback((_, node) => {
    selectBranch(node.id)
  }, [selectBranch])

  const selectedCount = nodes.filter(n => n.selected).length

  return (
    <section id="arbol-visual" className="py-20 px-4 sm:px-6 lg:px-10" style={{ backgroundColor: '#0F172A' }}>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium tracking-wide uppercase mb-3" style={{ color: '#6B9080' }}>
            <GitBranch className="w-4 h-4" />
            Vista Interactiva
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4" style={{ color: '#FFFFFF' }}>
            Arbol Genealogico Visual
          </h2>
          <p className="text-base max-w-2xl mx-auto mb-2" style={{ color: '#64748B' }}>
            Arrastra tarjetas para moverlas. Doble clic en un nodo para seleccionar toda su rama.
          </p>
          <p className="text-xs mt-1" style={{ color: '#B8976A' }}>
            Activa la cuadricula para alinear tarjetas con precision
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-white/50 mt-3">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#B8976A]" /> Abuelos</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#6B9080]" /> Hombres</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#B8654A]" /> Mujeres</span>
          </div>
        </motion.div>

        {/* Tree container */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={`rounded-2xl overflow-hidden shadow-lg border-4 border-white/80 ${isFullscreen ? 'fixed inset-0 z-[60] rounded-none' : 'h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px]'}`}
          style={{ backgroundColor: '#0F172A', touchAction: 'none' }}
        >
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: '#B8654A', borderTopColor: 'transparent' }} />
                <p className="mt-3 text-sm text-white/60">Cargando arbol...</p>
              </div>
            </div>
          ) : nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              onNodeDoubleClick={onNodeDoubleClick}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2.5}
              attributionPosition="bottom-left"
              panOnScroll={false}
              zoomOnPinch={true}
              panOnDrag={tool === 'move' ? true : [1, 2]}
              selectionOnDrag={tool === 'select'}
              selectNodesOnDrag={tool === 'select'}
              preventScrolling={true}
              snapToGrid={snapToGrid}
              snapGrid={SNAP_GRID}
              multiSelectionKeyCode="Shift"
              deleteKeyCode={null}
            >
              <Controls position="top-right" style={{ borderRadius: '12px', overflow: 'hidden' }} />
              {showGrid && (
                <Background
                  color={snapToGrid ? '#B8654A30' : '#E2E8F030'}
                  gap={snapToGrid ? SNAP_GRID[0] : 20}
                  variant={snapToGrid ? 'lines' : 'dots'}
                />
              )}
              <MiniMap
                position="bottom-right"
                style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #E2E8F0' }}
                nodeColor={(n) => {
                  if (n.selected) return '#3B82F6'
                  if (n.data?.isGrandparent) return '#B8976A'
                  if (n.data?.gender === 'F') return '#B8654A'
                  return '#6B9080'
                }}
                maskColor="rgba(253, 248, 240, 0.7)"
              />

              {/* ── Toolbar Panel ─────────────────────────── */}
              <Panel position="top-left" className="flex flex-col gap-1.5">
                {/* Row 1: Main tools */}
                <div className="flex flex-wrap gap-1.5">
                  <ToolBtn
                    icon={Maximize2}
                    label={isFullscreen ? 'Salir' : 'Completa'}
                    active={isFullscreen}
                    color="#B8654A"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    tip="Pantalla completa"
                  />
                  <ToolBtn
                    icon={Grid3X3}
                    label="Cuadricula"
                    active={snapToGrid}
                    color="#6B9080"
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    tip="Activar cuadricula de alineacion (snap)"
                  />
                  <ToolBtn
                    icon={BoxSelect}
                    label={tool === 'select' ? 'Seleccion' : 'Seleccionar'}
                    active={tool === 'select'}
                    color="#3B82F6"
                    onClick={() => setTool(t => t === 'select' ? 'move' : 'select')}
                    tip="Arrastra para seleccionar multiples tarjetas"
                  />
                  <ToolBtn
                    icon={FoldVertical}
                    label="Agrupar"
                    color="#8B5CF6"
                    onClick={groupSelected}
                    tip="Selecciona varias tarjetas y agrupa para moverlas como un solo bloque"
                  />
                  <ToolBtn
                    icon={UnfoldVertical}
                    label="Desagrupar"
                    color="#8B5CF6"
                    onClick={ungroupSelected}
                    active={groups.length > 0}
                    tip="Desagrupar para que se muevan independiente"
                  />
                  <ToolBtn
                    icon={LayoutGrid}
                    label="Reorganizar"
                    color="#B8976A"
                    onClick={() => loadTree(true)}
                    tip="Restablecer posiciones originales (borra tu acomodo)"
                  />
                  <ToolBtn
                    icon={RotateCcw}
                    label="Restablecer"
                    onClick={() => { deselectAll(); loadTree(true) }}
                    tip="Recargar arbol desde datos"
                  />
                </div>

                {/* Row 2: Alignment tools (show when nodes selected) */}
                {selectedCount >= 2 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-medium text-white bg-blue-500 px-2 py-0.5 rounded-full">
                      {selectedCount} seleccionados
                    </span>
                    <ToolBtn
                      icon={AlignCenterHorizontal}
                      label="Alinear H"
                      color="#0F172A"
                      onClick={alignSelectedH}
                      tip="Alinear horizontalmente (misma fila)"
                    />
                    <ToolBtn
                      icon={AlignCenterVertical}
                      label="Alinear V"
                      color="#0F172A"
                      onClick={alignSelectedV}
                      tip="Alinear verticalmente (misma columna)"
                    />
                    {selectedCount >= 3 && (
                      <ToolBtn
                        icon={ChevronDown}
                        label="Distribuir"
                        color="#0F172A"
                        onClick={distributeSelectedH}
                        tip="Distribuir horizontalmente con espacio parejo"
                      />
                    )}
                    <button
                      onClick={deselectAll}
                      className="text-[10px] text-white/60 underline hover:text-white ml-1"
                    >
                      Deseleccionar
                    </button>
                  </div>
                )}
              </Panel>

              {/* ── Info Panel ────────────────────────────── */}
              <Panel position="bottom-left">
                <div className="flex items-center gap-3 px-2.5 py-1 rounded-lg bg-white/5 shadow text-[11px] text-white/60">
                  <span>{nodes.length} nodos</span>
                  <span>{edges.length} conexiones</span>
                  {snapToGrid && <span className="text-[#6B9080] font-medium">Snap activo</span>}
                  {tool === 'select' && <span className="text-blue-500 font-medium">Modo seleccion</span>}
                  {groups.length > 0 && <span className="text-[#8B5CF6] font-medium">{groups.length} grupo{groups.length > 1 ? 's' : ''}</span>}
                </div>
              </Panel>
            </ReactFlow>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-[#B8654A]/30" />
                <p className="text-white/50">Agrega familiares para ver el arbol</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
