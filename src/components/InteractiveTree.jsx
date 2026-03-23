import { useState, useEffect, useCallback, useMemo } from 'react'
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'
import { GitBranch, Users, Heart, User, ZoomIn } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

const NODE_W = 170
const V_GAP = 130
const H_GAP = 25

function PersonNode({ data }) {
  const { name, photoURL, gender, isDeceased, role, spouse, isGrandparent } = data
  const borderColor = isGrandparent ? '#B8943E' : gender === 'F' ? '#C4704B' : '#7A9E7E'
  const bgColor = isGrandparent ? '#FFFBF5' : '#FAF6EE'

  return (
    <div
      className="rounded-xl shadow-md border-2 px-3 py-2 text-center relative"
      style={{
        backgroundColor: bgColor,
        borderColor,
        width: NODE_W,
        minWidth: NODE_W,
        opacity: isDeceased ? 0.75 : 1,
      }}
    >
      <div className="flex items-center gap-2">
        {photoURL ? (
          <img src={photoURL} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ border: `2px solid ${borderColor}` }} />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${borderColor}20` }}>
            <User className="w-5 h-5" style={{ color: borderColor }} />
          </div>
        )}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[11px] font-bold text-[#5D4037] leading-tight truncate">{name}</p>
          {role && <p className="text-[9px] text-[#7A9E7E] font-medium">{role}</p>}
          {isDeceased && <p className="text-[8px] text-[#B8943E] italic">En memoria</p>}
        </div>
      </div>
      {spouse && (
        <div className="mt-1.5 pt-1.5 border-t flex items-center gap-1.5" style={{ borderColor: `${borderColor}30` }}>
          <Heart className="w-3 h-3 text-[#C4704B] flex-shrink-0" />
          {spouse.photoURL ? (
            <img src={spouse.photoURL} alt={spouse.name} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C4704B15' }}>
              <User className="w-3 h-3 text-[#C4704B]" />
            </div>
          )}
          <p className="text-[9px] text-[#5D4037] truncate">{typeof spouse === 'object' ? spouse.name : spouse}</p>
        </div>
      )}
      <Handle type="target" position={Position.Top} style={{ background: borderColor, width: 8, height: 8, border: '2px solid white' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: borderColor, width: 8, height: 8, border: '2px solid white' }} />
    </div>
  )
}

const nodeTypes = { person: PersonNode }

// Calculate the total leaf-width of a person's subtree
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
    { stroke: '#C4704B', strokeWidth: 2.5 },
    { stroke: '#7A9E7E', strokeWidth: 2 },
    { stroke: '#B8943E', strokeWidth: 1.5 },
    { stroke: '#5D4037', strokeWidth: 1 },
  ]

  // Recursive: place a person and all descendants
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

  // Build root: grandparents as single node, then place each member as subtree
  const gf = grandparentsData?.grandfather
  const gm = grandparentsData?.grandmother

  // Calculate total width needed for all member subtrees
  const totalWidth = members.reduce((s, m) => s + subtreeWidth(m), 0)
  const rootY = 0
  const childrenY = V_GAP

  // Place grandparent node
  const gpId = getId()
  nodes.push({
    id: gpId,
    type: 'person',
    position: { x: 0, y: rootY },
    data: {
      name: gf?.fullName || gf?.name || 'Abuelos',
      photoURL: gf?.photoURL,
      gender: 'M',
      isGrandparent: true,
      role: gf?.role || 'Patriarca',
      spouse: gm ? { name: gm.fullName || gm.name, photoURL: gm.photoURL } : null,
    },
  })

  // Place each member subtree
  let curX = -totalWidth / 2 + NODE_W / 2
  members.forEach((member) => {
    const mWidth = subtreeWidth(member)
    const mX = curX + mWidth / 2 - NODE_W / 2
    placeSubtree(member, mX, childrenY, 1, gpId)
    curX += mWidth
  })

  // Center grandparent above children
  const level1 = nodes.filter(n => n.position.y === childrenY)
  if (level1.length > 0) {
    const minX = Math.min(...level1.map(n => n.position.x))
    const maxX = Math.max(...level1.map(n => n.position.x))
    nodes[0].position.x = (minX + maxX) / 2
  }

  return { nodes, edges }
}

export default function InteractiveTree() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTree()
  }, [])

  const loadTree = async () => {
    const [members, gp] = await Promise.all([getFamilyMembers(), getGrandparents()])
    if (members.length > 0 || gp) {
      const { nodes: n, edges: e } = buildTree(members, gp)
      setNodes(n)
      setEdges(e)
    }
    setLoading(false)
  }

  return (
    <section id="arbol-visual" className="py-20 px-4 sm:px-6 lg:px-10" style={{ backgroundColor: '#FFFDF7' }}>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium tracking-wide uppercase mb-3" style={{ color: '#7A9E7E' }}>
            <GitBranch className="w-4 h-4" />
            Vista Interactiva
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4" style={{ color: '#5D4037' }}>
            Arbol Genealogico Visual
          </h2>
          <p className="text-base max-w-2xl mx-auto mb-2" style={{ color: '#6B5B5B' }}>
            Navega por el arbol completo. Arrastra para moverte, usa scroll para zoom.
          </p>
          <p className="text-xs mt-2 sm:hidden" style={{ color: '#B8943E' }}>Usa dos dedos para zoom, arrastra para moverte</p>
          <div className="flex items-center justify-center gap-6 text-xs text-[#5D4037]/50">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#B8943E]" /> Abuelos</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#7A9E7E]" /> Hombres</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#C4704B]" /> Mujeres</span>
          </div>
        </motion.div>

        {/* Tree container */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl overflow-hidden shadow-lg border border-[#E0D5C8] h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px]"
          style={{ backgroundColor: '#FEFCF8', touchAction: 'none' }}
        >
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: '#C4704B', borderTopColor: 'transparent' }} />
                <p className="mt-3 text-sm text-[#5D4037]/60">Cargando arbol...</p>
              </div>
            </div>
          ) : nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2.5}
              attributionPosition="bottom-left"
              panOnScroll={false}
              zoomOnPinch={true}
              panOnDrag={true}
              preventScrolling={true}
            >
              <Controls position="top-right" showInteractive={false} style={{ borderRadius: '12px', overflow: 'hidden' }} />
              <Background color="#E0D5C830" gap={20} />
            </ReactFlow>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-[#C4704B]/30" />
                <p className="text-[#5D4037]/50">Agrega familiares para ver el arbol</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
