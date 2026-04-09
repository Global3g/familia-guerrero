import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Users, User, Plus, Pencil, Trash2, Eye, AlertTriangle, ArrowRightLeft, Calendar, Home, MapPin, Star, Camera, MessageCircle, GitBranch, LayoutGrid } from 'lucide-react'
import { grandparents as defaultGrandparents } from '../data/familyData'
import { getFamilyMembers, saveFamilyMember, deleteFamilyMember, getGrandparents } from '../firebase/familyService'
import FamilyMemberForm from './FamilyMemberForm'
import sounds from '../utils/sounds'

const ReactFlowLazy = lazy(() => import('reactflow').then(mod => ({ default: mod.default })))
const ControlsLazy = lazy(() => import('reactflow').then(mod => ({ default: mod.Controls })))
const BackgroundLazy = lazy(() => import('reactflow').then(mod => ({ default: mod.Background })))
const MiniMapLazy = lazy(() => import('reactflow').then(mod => ({ default: mod.MiniMap })))

const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function formatDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const day = parseInt(parts[2])
  const month = parseInt(parts[1])
  const year = parts[0]
  return `${day} de ${monthNames[month - 1]} de ${year}`
}

function calcAge(birthDate, deathDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const end = deathDate ? new Date(deathDate) : new Date()
  let age = end.getFullYear() - birth.getFullYear()
  const m = end.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--
  return { age, deceased: !!deathDate }
}

function AgeBadge({ birthDate, deathDate }) {
  const result = calcAge(birthDate, deathDate)
  if (!result) return null
  return (
    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
      result.deceased
        ? 'bg-white/15/15 text-white/70'
        : 'bg-white/15/15 text-white/70'
    }`}>
      {result.deceased ? `${result.age} años` : `${result.age} años`}
    </span>
  )
}

function PersonCircle({ name, photo, size = 'md', onClick }) {
  const sizes = {
    xs: 'w-12 h-12',
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
    xxl: 'w-44 h-44',
  }
  const iconSizes = { xs: 'w-5 h-5', sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-14 h-14', xxl: 'w-16 h-16' }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center shadow-md ${
        photo ? '' : 'bg-gradient-to-br from-white/10 to-white/5'
      } ${photo && onClick ? 'cursor-pointer ring-2 ring-transparent hover:ring-white/20 transition-all' : ''}`}
      onClick={photo && onClick ? onClick : undefined}
    >
      {photo ? (
        <img src={photo} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
      ) : (
        <User className={`${iconSizes[size]} text-white/90`} />
      )}
    </div>
  )
}

function GrandparentsPair({ grandparentsData }) {
  const gp = grandparentsData || defaultGrandparents
  const grandfather = gp.grandfather || defaultGrandparents.grandfather
  const grandmother = gp.grandmother || defaultGrandparents.grandmother
  const weddingYear = (gp.weddingDate || defaultGrandparents.weddingDate || '').split('-')[0]

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-6 sm:gap-10 p-6 rounded-2xl border-4 border-white/80" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex flex-col items-center gap-1.5">
          <PersonCircle name={grandfather.fullName || grandfather.name} photo={grandfather.photoURL || grandfather.photo} size="lg" />
          <p className="text-lg font-serif font-bold text-white text-center leading-tight">{grandfather.fullName || grandfather.name}</p>
          {grandfather.nickname && <p className="text-xs text-white/70 font-medium italic">"{grandfather.nickname}"</p>}
          <p className="text-xs text-white/50 font-medium">{grandfather.role}</p>
          <AgeBadge birthDate={grandfather.birthDate} deathDate={grandfather.deathDate} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Heart className="w-8 h-8 text-white/70 fill-white/50" />
          {weddingYear && <span className="text-xs text-white/70 font-medium">{weddingYear}</span>}
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <PersonCircle name={grandmother.fullName || grandmother.name} photo={grandmother.photoURL || grandmother.photo} size="lg" />
          <p className="text-lg font-serif font-bold text-white text-center leading-tight">{grandmother.fullName || grandmother.name}</p>
          {grandmother.nickname && <p className="text-xs text-white/70 font-medium italic">"{grandmother.nickname}"</p>}
          <p className="text-xs text-white/50 font-medium">{grandmother.role}</p>
          <AgeBadge birthDate={grandmother.birthDate} deathDate={grandmother.deathDate} />
        </div>
      </div>
      <div className="w-px h-12 bg-white/20 mt-4" />
    </div>
  )
}

function ChildCard({ child, onEdit, onDelete, onView }) {
  const spouse = child.spouse
  const hasSpouse = spouse && (typeof spouse === 'object' ? spouse.name : spouse)

  return (
    <motion.div
      layout
      className="bg-white/5 rounded-2xl p-6 sm:p-7 border-4 border-white/80 hover:border-white/20 hover:bg-white/10 transition-all duration-300 relative group cursor-pointer"
      style={{ width: hasSpouse ? '340px' : '200px', maxWidth: '100%' }}
      onClick={onView}
    >
      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition"
          title="Editar"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {child.role && (
        <span className="absolute -top-2.5 left-4 text-[10px] font-semibold uppercase tracking-[2px] px-2.5 py-0.5 rounded-full bg-white/10 text-white/50 border-4 border-white/80">
          {child.role}
        </span>
      )}

      {/* Couple layout */}
      <div className="flex items-start justify-center gap-4">
        {/* Main person */}
        <div className="flex flex-col items-center text-center min-w-0 flex-1">
          <PersonCircle name={child.name || child.fullName} photo={child.photoURL || child.photo} size="xl" />
          <p className="text-sm font-serif font-bold text-white leading-tight mt-3 line-clamp-2">
            {child.name || child.fullName || 'Miembro'}
          </p>
          {child.nickname && (
            <p className="text-xs text-white/40 italic mt-0.5">"{child.nickname}"</p>
          )}
          <div className="mt-1.5">
            <AgeBadge birthDate={child.birthDate} deathDate={child.deathDate} />
          </div>
        </div>

        {/* Heart connector */}
        {hasSpouse && (
          <>
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-14">
              <Heart className="w-4 h-4 text-white/70/60 fill-white/50/60" />
            </div>

            {/* Spouse */}
            <div className="flex flex-col items-center text-center min-w-0 flex-1">
              {typeof spouse === 'object' ? (
                <>
                  <PersonCircle name={spouse.name} photo={spouse.photoURL} size="xl" />
                  <p className="text-sm font-serif font-bold text-white leading-tight mt-3 line-clamp-2">
                    {spouse.name}
                  </p>
                  {spouse.nickname && (
                    <p className="text-xs text-white/40 italic mt-0.5">"{spouse.nickname}"</p>
                  )}
                  <div className="mt-1.5">
                    <AgeBadge birthDate={spouse.birthDate} deathDate={spouse.deathDate} />
                  </div>
                </>
              ) : (
                <>
                  <PersonCircle name={spouse} photo={null} size="xl" />
                  <p className="text-sm font-serif font-bold text-white leading-tight mt-3 line-clamp-2">
                    {spouse}
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {child.children && child.children.length > 0 && (() => {
        const hijos = child.children.length
        const hasSpouseCount = (arr) => arr.reduce((s, c) => s + (c.spouse && (typeof c.spouse === 'object' ? c.spouse.name : c.spouse) ? 1 : 0), 0)
        const yernos = hasSpouseCount(child.children)
        const nietos = child.children.reduce((s, c) => s + (c.children?.length || 0), 0)
        const yernosNietos = child.children.reduce((s, c) => s + hasSpouseCount(c.children || []), 0)
        const bisnietos = child.children.reduce((s, c) =>
          s + (c.children || []).reduce((s2, gc) => s2 + (gc.children?.length || 0), 0), 0)
        return (
          <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-white/80 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-white/50">
              <Users className="w-3.5 h-3.5 text-white/70" />
              {hijos} hijos
            </span>
            {yernos > 0 && (
              <span className="text-xs text-white/40 font-medium">{yernos} yernos/nueras</span>
            )}
            {nietos > 0 && (
              <span className="text-xs text-white/40 font-medium">{nietos} nietos</span>
            )}
            {yernosNietos > 0 && (
              <span className="text-xs text-white/40 font-medium">{yernosNietos} parejas</span>
            )}
            {bisnietos > 0 && (
              <span className="text-xs text-white/40 font-medium">{bisnietos} bisnietos</span>
            )}
          </div>
        )
      })()}
    </motion.div>
  )
}

function DeleteConfirm({ member, onConfirm, onCancel }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        className="relative bg-[#1E293B] rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-serif font-bold text-white mb-2">Eliminar familiar</h3>
        <p className="text-sm text-white/70 mb-6">
          ¿Estas seguro de eliminar a <strong>{member.name}</strong>? Esta accion no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border-4 border-white/80 text-white hover:bg-white/10 transition text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm font-medium"
          >
            Si, eliminar
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function MoveModal({ person, members, currentParentId, isDeepNested, onMove, onCancel }) {
  const [selectedTarget, setSelectedTarget] = useState(null)

  // Build flat list of possible destinations
  const destinations = []
  members.forEach((m) => {
    // Always show all top-level members as destinations
    // Only skip current parent if the person is already a direct child (not deep nested)
    if (m.id !== currentParentId || isDeepNested) {
      destinations.push({ id: m.id, name: m.name, level: 'hijo', parentId: null })
    }
    // Also show children of each member as destinations
    (m.children || []).filter(c => c && c !== null).forEach((c, ci) => {
      // Don't show the person itself as a destination
      if (c.name === person.name) return
      destinations.push({ id: `${m.id}__${ci}`, name: `${c.name} (hijo de ${m.name?.split(' ')[0]})`, level: 'nieto', parentId: m.id, childIndex: ci })
    })
  })

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        className="relative bg-[#1E293B] rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="w-12 h-12 rounded-full bg-white/15/10 flex items-center justify-center mx-auto mb-4">
          <ArrowRightLeft className="w-6 h-6 text-white/70" />
        </div>
        <h3 className="text-lg font-serif font-bold text-white mb-1 text-center">Mover a {person.name}</h3>
        <p className="text-xs text-white/60 text-center mb-4">Selecciona donde quieres ubicar a esta persona</p>

        <div className="space-y-2 mb-6">
          {destinations.map((dest) => (
            <button
              key={dest.id}
              type="button"
              onClick={() => setSelectedTarget(dest)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm ${
                selectedTarget?.id === dest.id
                  ? 'border-white/20 bg-white/15/10 text-white font-semibold'
                  : 'border-white/20/10 bg-white hover:bg-white/5 text-white/80'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white/70 flex-shrink-0" />
                <span>Como hijo de <strong>{dest.name}</strong></span>
              </span>
            </button>
          ))}
          {destinations.length === 0 && (
            <p className="text-sm text-white/50 text-center py-4">No hay otros familiares disponibles</p>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-white/20/20 text-white hover:bg-white/5 transition text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => selectedTarget && onMove(selectedTarget)}
            disabled={!selectedTarget}
            className="px-5 py-2 rounded-lg bg-white/15 text-white hover:bg-white/15/90 transition text-sm font-medium disabled:opacity-40"
          >
            Mover aqui
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Nucleus Tree Node ─────────────────────────────────────
function NucleusPersonNode({ data }) {
  const { name, photoURL, gender, isDeceased, role, spouse, isRoot } = data
  const borderColor = isRoot ? 'rgba(255, 255, 255, 0.15)' : gender === 'F' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.15)'
  const bgColor = isRoot ? '#FFFFFF' : '#F1F5F9'

  return (
    <div
      className="rounded-xl shadow-md border-2 px-3 py-2 text-center relative"
      style={{
        backgroundColor: bgColor,
        borderColor,
        width: 180,
        opacity: isDeceased ? 0.75 : 1,
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
          {role && <p className="text-[11px] text-white/70 font-medium">{role}</p>}
          {isDeceased && <p className="text-[11px] text-white/70 italic">En memoria</p>}
        </div>
      </div>
      {spouse && (
        <div className="mt-1.5 pt-1.5 border-t flex items-center gap-1.5" style={{ borderColor: `${borderColor}30` }}>
          <Heart className="w-3 h-3 text-white/70 flex-shrink-0" />
          {spouse.photoURL ? (
            <img src={spouse.photoURL} alt={spouse.name} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
              <User className="w-3 h-3 text-white/70" />
            </div>
          )}
          <p className="text-[11px] truncate" style={{ color: '#0F172A' }}>{spouse.name}</p>
        </div>
      )}
      {/* ReactFlow handles - imported dynamically */}
    </div>
  )
}

const nucleusNodeTypes = { person: NucleusPersonNode }

function buildNucleusTree(member) {
  const NODE_W = 180
  const V_GAP = 120
  const H_GAP = 30
  const nodes = []
  const edges = []
  let nodeId = 0
  const getId = () => `nn${nodeId++}`

  const subtreeW = (person) => {
    const kids = (person.children || []).filter(c => c && c !== null)
    if (kids.length === 0) return NODE_W + H_GAP
    return kids.reduce((sum, c) => sum + subtreeW(c), 0)
  }

  const edgeColors = ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.15)', '#0F172A']

  function place(person, x, y, depth, parentId) {
    const id = getId()
    const color = edgeColors[Math.min(depth, edgeColors.length - 1)]
    const sp = person.spouse && typeof person.spouse === 'object' ? person.spouse : null

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
        isRoot: depth === 0,
        spouse: sp ? { name: sp.name, photoURL: sp.photoURL } : (person.spouse && typeof person.spouse === 'string' ? { name: person.spouse } : null),
      },
    })

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: 'smoothstep',
        style: { stroke: `${color}90`, strokeWidth: 2 },
      })
    }

    const kids = (person.children || []).filter(c => c && c !== null)
    if (kids.length > 0) {
      const totalW = kids.reduce((s, c) => s + subtreeW(c), 0)
      let cx = x - totalW / 2 + NODE_W / 2
      kids.forEach((child) => {
        const childW = subtreeW(child)
        const childX = cx + childW / 2 - NODE_W / 2
        place(child, childX, y + V_GAP, depth + 1, id)
        cx += childW
      })
    }
  }

  place(member, 0, 0, 0, null)
  return { nodes, edges }
}

function NucleusTreeView({ member }) {
  const [rfModule, setRfModule] = useState(null)

  useEffect(() => {
    import('reactflow').then(mod => {
      import('reactflow/dist/style.css')
      setRfModule(mod)
    })
  }, [])

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildNucleusTree(member), [member])

  if (!rfModule) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(255, 255, 255, 0.15)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const { default: ReactFlow, Controls, Background, MiniMap, Handle, Position } = rfModule

  // Re-define node component with handles now that we have access to Handle/Position
  const PersonNodeWithHandles = ({ data }) => {
    const { name, photoURL, gender, isDeceased, role, spouse, isRoot } = data
    const borderColor = isRoot ? 'rgba(255, 255, 255, 0.15)' : gender === 'F' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.15)'
    const bgColor = isRoot ? '#FFFFFF' : '#F1F5F9'

    return (
      <div
        className="rounded-xl shadow-md border-2 px-3 py-2 text-center relative"
        style={{
          backgroundColor: bgColor,
          borderColor,
          width: 180,
          opacity: isDeceased ? 0.75 : 1,
        }}
      >
        <Handle type="target" position={Position.Top} style={{ background: borderColor, width: 8, height: 8, border: '2px solid white' }} />
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
            {role && <p className="text-[11px] text-white/70 font-medium">{role}</p>}
            {isDeceased && <p className="text-[11px] text-white/70 italic">En memoria</p>}
          </div>
        </div>
        {spouse && (
          <div className="mt-1.5 pt-1.5 border-t flex items-center gap-1.5" style={{ borderColor: `${borderColor}30` }}>
            <Heart className="w-3 h-3 text-white/70 flex-shrink-0" />
            {spouse.photoURL ? (
              <img src={spouse.photoURL} alt={spouse.name} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
                <User className="w-3 h-3 text-white/70" />
              </div>
            )}
            <p className="text-[11px] truncate" style={{ color: '#0F172A' }}>{spouse.name}</p>
          </div>
        )}
        <Handle type="source" position={Position.Bottom} style={{ background: borderColor, width: 8, height: 8, border: '2px solid white' }} />
      </div>
    )
  }

  const nodeTypesWithHandles = { person: PersonNodeWithHandles }

  return (
    <div className="rounded-2xl overflow-hidden border-4 border-white/80 shadow-md" style={{ height: '500px', backgroundColor: '#0F172A' }}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypesWithHandles}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        panOnScroll={false}
        zoomOnPinch={true}
        preventScrolling={true}
        deleteKeyCode={null}
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable={false}
      >
        <Controls position="top-right" style={{ borderRadius: '12px', overflow: 'hidden' }} />
        <Background color="#E2E8F030" gap={20} variant="dots" />
        <MiniMap
          position="bottom-right"
          style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #E2E8F0' }}
          nodeColor={(n) => {
            if (n.data?.isRoot) return 'rgba(255, 255, 255, 0.15)'
            if (n.data?.gender === 'F') return 'rgba(255, 255, 255, 0.15)'
            return 'rgba(255, 255, 255, 0.15)'
          }}
          maskColor="rgba(253, 248, 240, 0.7)"
        />
      </ReactFlow>
    </div>
  )
}

// ── Nucleus Card-Tree View (like main tree but for a single nucleus) ──
function NucleusCardTree({ member, onClose }) {
  const genLabels = [
    { M: 'Hijo', F: 'Hija', default: 'Hijo(a)', plural: 'Hijos' },
    { M: 'Nieto', F: 'Nieta', default: 'Nieto(a)', plural: 'Nietos' },
    { M: 'Bisnieto', F: 'Bisnieta', default: 'Bisnieto(a)', plural: 'Bisnietos' },
  ]

  // Elegant minimalist design - neutral tones only
  const genThemes = [
    {
      gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
      glow: 'rgba(255, 255, 255, 0.05)',
      accent: 'rgba(255, 255, 255, 0.9)',
      pillBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
      line: 'rgba(255, 255, 255, 0.15)'
    },
    {
      gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
      glow: 'rgba(255, 255, 255, 0.05)',
      accent: 'rgba(255, 255, 255, 0.9)',
      pillBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
      line: 'rgba(255, 255, 255, 0.15)'
    },
    {
      gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
      glow: 'rgba(255, 255, 255, 0.05)',
      accent: 'rgba(255, 255, 255, 0.9)',
      pillBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
      line: 'rgba(255, 255, 255, 0.15)'
    },
  ]

  // Elegant neutral card colors - white/gray only
  const cardColors = [
    ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)'],
    ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)'],
    ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)'],
  ]

  // ── Build generation rows ──
  const generations = []
  if (member.children?.length > 0) {
    const filteredChildren = member.children.filter(c => c && c !== null)
    if (filteredChildren.length > 0) {
      generations.push([{ parent: member, children: filteredChildren }])
    }
  }
  let prevGen = (member.children || []).filter(c => c && c !== null)
  while (true) {
    const groups = []
    prevGen.forEach(person => {
      if (person.children?.length > 0) {
        groups.push({ parent: person, children: person.children.filter(c => c && c !== null) })
      }
    })
    if (groups.length === 0) break
    generations.push(groups)
    prevGen = groups.flatMap(g => g.children)
  }

  // Root couple
  const sp = member.spouse
  const hasSp = sp && (typeof sp === 'object' ? sp.name : sp)
  const wy = (member.weddingDate || '').split('-')[0]

  const getLastName = (fullName) => {
    if (!fullName) return ''
    const parts = fullName.trim().split(' ')
    return parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1]
  }
  const familyTitle = `Familia ${getLastName(member.name)}`

  return (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 40%, #0F172A 100%)' }}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      {/* Header bar - minimalist elegant */}
      <div className="relative flex items-center justify-between px-8 py-6 border-b border-white/5 flex-shrink-0" style={{
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(20px)'
      }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
            <GitBranch className="w-6 h-6 text-white/80" />
          </div>
          <div>
            <h3 className="elegant-heading text-2xl text-white">{familyTitle}</h3>
            <p className="text-xs text-white/40 font-light tracking-wider uppercase mt-1">Árbol Genealógico</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all"
        >
          <span className="text-3xl font-light">&times;</span>
        </button>
      </div>

      {/* Scrollable tree area */}
      <div className="relative flex-1 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        <div className="inline-flex flex-col items-center min-w-full py-10 px-10">

          {/* ═══ ROOT COUPLE - Minimalist Elegant ═══ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mb-16"
          >
            <div className="relative rounded-3xl px-16 py-14" style={{
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div className="relative flex items-center justify-center gap-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="rounded-full p-2 bg-white/5 ring-1 ring-white/10">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt={member.name} className="w-36 h-36 rounded-full object-cover" />
                      ) : (
                        <div className="w-36 h-36 rounded-full flex items-center justify-center bg-white/5">
                          <User className="w-16 h-16 text-white/30" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center max-w-[180px]">
                    <p className="elegant-heading text-xl text-white leading-tight mb-2">{member.name}</p>
                    {member.nickname && <p className="text-sm text-white/50 italic font-light mb-2">"{member.nickname}"</p>}
                    <AgeBadge birthDate={member.birthDate} deathDate={member.deathDate} />
                  </div>
                </div>

                {hasSp && (
                  <>
                    <div className="flex flex-col items-center gap-4">
                      <Heart className="w-10 h-10 text-white/60 fill-white/20" />
                      {wy && (
                        <span className="text-xs text-white/40 font-light tracking-wider">{wy}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="rounded-full p-2 bg-white/5 ring-1 ring-white/10">
                          {typeof sp === 'object' && sp.photoURL ? (
                            <img src={sp.photoURL} alt={sp.name} className="w-36 h-36 rounded-full object-cover" />
                          ) : (
                            <div className="w-36 h-36 rounded-full flex items-center justify-center bg-white/5">
                              <User className="w-16 h-16 text-white/30" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-center max-w-[180px]">
                        <p className="elegant-heading text-xl text-white leading-tight mb-2">{typeof sp === 'object' ? sp.name : sp}</p>
                        {typeof sp === 'object' && sp.nickname && <p className="text-sm text-white/50 italic font-light mb-2">"{sp.nickname}"</p>}
                        {typeof sp === 'object' && <AgeBadge birthDate={sp.birthDate} deathDate={sp.deathDate} />}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* ═══ GENERATION ROWS ═══ */}
          {generations.map((groups, genIndex) => {
            const labels = genLabels[Math.min(genIndex, genLabels.length - 1)]
            const theme = genThemes[genIndex % genThemes.length]
            const totalPeople = groups.reduce((s, g) => s + g.children.length, 0)

            return (
              <div key={genIndex} className="flex flex-col items-center w-full">

                {/* Elegant connector line */}
                <div className="w-px h-12" style={{ background: `linear-gradient(to bottom, transparent, ${theme.line}, transparent)` }} />

                {/* Generation label - Minimalist */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: genIndex * 0.1 }}
                  className="mb-12"
                >
                  <div className="inline-flex items-center gap-4 px-10 py-4 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5">
                      <Users className="w-5 h-5 text-white/70" />
                    </div>
                    <div>
                      <p className="elegant-heading text-lg text-white leading-none">{labels.plural}</p>
                      <p className="text-xs text-white/40 font-light mt-1">{totalPeople} {totalPeople === 1 ? 'persona' : 'personas'}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Groups */}
                <div className="flex justify-center gap-14 flex-wrap">
                  {groups.map((group, gi) => {
                    const kids = (group.children || []).filter(c => c && c !== null)
                    return (
                      <div key={gi} className="flex flex-col items-center">
                        {/* Group parent label */}
                        {groups.length > 1 && (
                          <div className="mb-8">
                            <div className="px-6 py-3 rounded-xl" style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                              <p className="text-sm text-white/50 font-light tracking-wide">
                                Familia de {group.parent.name?.split(' ')[0]}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Horizontal connector bar */}
                        {kids.length > 1 && (
                          <div className="relative flex justify-center mb-0" style={{ width: `${kids.length * 280}px` }}>
                            <div className="absolute top-0 left-[140px] right-[140px] h-px bg-white/5" />
                          </div>
                        )}

                        {/* Cards row - BIGGER CARDS */}
                        <div className="flex justify-center gap-6">
                          {kids.map((child, ci) => {
                            const [colorFrom, colorTo] = cardColors[(ci + gi * 3) % cardColors.length]
                            const lbl = child.gender === 'M' ? labels.M : child.gender === 'F' ? labels.F : labels.default
                            const childSp = child.spouse
                            const childHasSp = childSp && (typeof childSp === 'object' ? childSp.name : childSp)

                            return (
                              <div key={ci} className="flex flex-col items-center" style={{ width: '280px' }}>
                                {/* Tick */}
                                <div className="w-px h-6 bg-white/5" />

                                {/* Card - LARGER & MINIMALIST */}
                                <motion.div
                                  initial={{ opacity: 0, y: 12 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: ci * 0.05 + genIndex * 0.1 }}
                                  className="w-full"
                                >
                                  <div className="relative rounded-2xl overflow-hidden" style={{
                                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                                    backdropFilter: 'blur(20px)',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                  }}>
                                    {/* Header label */}
                                    <div className="px-6 py-3 border-b border-white/5" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                                      <p className="text-xs text-white/50 font-light text-center tracking-wider uppercase">{lbl}</p>
                                    </div>

                                    {/* Person - BIGGER */}
                                    <div className="px-6 py-6">
                                      <div className="flex flex-col items-center gap-4">
                                        <div className="rounded-full p-1.5 bg-white/5 ring-1 ring-white/10">
                                          {child.photoURL ? (
                                            <img src={child.photoURL} alt={child.name} className="w-24 h-24 rounded-full object-cover" />
                                          ) : (
                                            <div className="w-24 h-24 rounded-full flex items-center justify-center bg-white/5">
                                              <User className="w-10 h-10 text-white/30" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-center w-full">
                                          <p className="elegant-heading text-base text-white leading-tight mb-1 px-2">{child.name}</p>
                                          {child.nickname && <p className="text-xs italic text-white/50 font-light mb-2">"{child.nickname}"</p>}
                                          <AgeBadge birthDate={child.birthDate} deathDate={child.deathDate} />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Spouse - BIGGER */}
                                    {childHasSp && (
                                      <div className="px-6 pb-6 border-t border-white/5 pt-5">
                                        <div className="flex items-center gap-4">
                                          <Heart className="w-5 h-5 text-white/40 fill-white/10 flex-shrink-0" />
                                          {typeof childSp === 'object' ? (
                                            <>
                                              <div className="rounded-full p-1 bg-white/5 ring-1 ring-white/10 flex-shrink-0">
                                                {childSp.photoURL ? (
                                                  <img src={childSp.photoURL} alt={childSp.name} className="w-14 h-14 rounded-full object-cover" />
                                                ) : (
                                                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/5">
                                                    <User className="w-6 h-6 text-white/30" />
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="elegant-heading text-sm text-white/90 truncate mb-1">{childSp.name}</p>
                                                <AgeBadge birthDate={childSp.birthDate} deathDate={childSp.deathDate} />
                                              </div>
                                            </>
                                          ) : (
                                            <p className="text-sm text-white/60 font-light">{childSp}</p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

        </div>
      </div>
    </div>
  )
}

export default function FamilyTree() {
  const [members, setMembers] = useState([])
  const [grandparentsData, setGrandparentsData] = useState(null)
  const [editingMember, setEditingMember] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deletingMember, setDeletingMember] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [movingPerson, setMovingPerson] = useState(null) // { person, parentId, childIndex }
  const [modalTab, setModalTab] = useState('familia')
  const [familiaView, setFamiliaView] = useState('tarjetas') // 'tarjetas' | 'arbol'
  const [lightboxPhoto, setLightboxPhoto] = useState(null)

  useEffect(() => {
    loadMembers()
    loadGrandparents()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      const { memberId, name } = e.detail || {}
      let member = null
      if (memberId) {
        member = members.find(m => m.id === memberId)
      } else if (name) {
        const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
        const target = norm(name)
        member = members.find(m => norm(m.fullName) === target || norm(m.name) === target)
      }
      if (member) {
        setModalTab('familia')
        setFamiliaView('tarjetas')
        setSelectedMember(member)
      }
    }
    window.addEventListener('open-family-modal', handler)
    return () => window.removeEventListener('open-family-modal', handler)
  }, [members])

  const loadGrandparents = async () => {
    const data = await getGrandparents()
    if (data) setGrandparentsData(data)
  }

  const sortByBirth = (arr) => {
    if (!arr) return arr
    const filtered = arr.filter(item => item && item !== null)
    filtered.sort((a, b) => {
      if (!a.birthDate && !b.birthDate) return 0
      if (!a.birthDate) return 1
      if (!b.birthDate) return -1
      return a.birthDate.localeCompare(b.birthDate)
    })
    filtered.forEach(p => { if (p.children) sortByBirth(p.children) })
    return filtered
  }

  const loadMembers = async () => {
    const data = await getFamilyMembers()
    // Sort all levels by birthDate (oldest first)
    sortByBirth(data)
    setMembers(data)
  }

  const handleSaveMember = async (formData) => {
    const id = editingMember?.id || null
    await saveFamilyMember(id, formData)
    sounds.save()
    setEditingMember(null)
    setShowCreateForm(false)
    await loadMembers()
  }

  const handleDeleteMember = async () => {
    if (deletingMember?.id) {
      await deleteFamilyMember(deletingMember.id)
      sounds.delete()
      setDeletingMember(null)
      await loadMembers()
    }
  }

  const familyStats = useMemo(() => {
    const hasSpouse = (p) => p.spouse && (typeof p.spouse === 'object' ? p.spouse.name : p.spouse) ? 1 : 0

    const hijos = members.length
    const espososHijos = members.reduce((s, c) => s + hasSpouse(c), 0)

    const nietos = members.reduce((s, c) => s + (c.children?.length || 0), 0)
    const espososNietos = members.reduce((s, c) =>
      s + (c.children || []).reduce((s2, gc) => s2 + hasSpouse(gc), 0), 0)

    const bisnietos = members.reduce((s, c) =>
      s + (c.children || []).reduce((s2, gc) => s2 + (gc.children?.length || 0), 0), 0)
    const espososBisnietos = members.reduce((s, c) =>
      s + (c.children || []).reduce((s2, gc) =>
        s2 + (gc.children || []).reduce((s3, bgc) => s3 + hasSpouse(bgc), 0), 0), 0)

    const totalPersonas = 2 + hijos + espososHijos + nietos + espososNietos + bisnietos + espososBisnietos

    return [
      { label: 'Hijos', value: `${hijos}`, sub: espososHijos > 0 ? `+ ${espososHijos} conyuges` : '' },
      { label: 'Nietos', value: `${nietos}`, sub: espososNietos > 0 ? `+ ${espososNietos} conyuges` : '' },
      ...(bisnietos > 0 ? [{ label: 'Bisnietos', value: `${bisnietos}`, sub: espososBisnietos > 0 ? `+ ${espososBisnietos} conyuges` : '' }] : []),
      { label: 'Total familia', value: `${totalPersonas}`, sub: '' },
    ]
  }, [members])

  const handleMovePerson = async (target) => {
    if (!movingPerson) return
    const { person, parentId, childIndex, grandchildIndex } = movingPerson

    // 1. Remove person from source parent
    const sourceParent = members.find((m) => m.id === parentId)
    if (sourceParent) {
      const updatedChildren = [...(sourceParent.children || [])].map((c, i) => ({ ...c, children: [...(c.children || [])] }))

      if (grandchildIndex !== undefined) {
        // Removing from grandchild level (nieto → bisnieto)
        updatedChildren[childIndex].children.splice(grandchildIndex, 1)
      } else {
        // Removing from direct child level
        updatedChildren.splice(childIndex, 1)
      }
      await saveFamilyMember(sourceParent.id, { ...sourceParent, children: updatedChildren })
    }

    // 2. Add person to target
    if (target.level === 'hijo') {
      // Moving as direct child of a top-level member
      const targetParent = members.find((m) => m.id === target.id)
      if (targetParent) {
        const updatedChildren = [...(targetParent.children || []), person]
        await saveFamilyMember(targetParent.id, { ...targetParent, children: updatedChildren })
      }
    } else if (target.level === 'nieto') {
      // Moving as child of a grandchild
      const targetParent = members.find((m) => m.id === target.parentId)
      if (targetParent) {
        const updatedChildren = [...(targetParent.children || [])]
        const targetChild = { ...updatedChildren[target.childIndex] }
        targetChild.children = [...(targetChild.children || []), person]
        updatedChildren[target.childIndex] = targetChild
        await saveFamilyMember(targetParent.id, { ...targetParent, children: updatedChildren })
      }
    }

    setMovingPerson(null)
    setSelectedMember(null)
    await loadMembers()
  }

  return (
    <section id="arbol" className="py-24 px-3 sm:px-6 lg:px-10" style={{ backgroundColor: '#0F172A' }}>
      <div className="w-full">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[16px] font-sans font-semibold uppercase tracking-[5px] text-white mb-4">Nuestras raices</p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-5">
            Arbol Familiar
          </h2>
          <div className="w-8 h-[1px] bg-white/15 mx-auto" />
          <p className="mt-6 max-w-3xl mx-auto text-3xl leading-relaxed font-medium italic" style={{ color: '#FFD700' }}>
            "Desde las raices hasta las nuevas ramas, cada miembro es parte esencial de esta historia."
          </p>
        </motion.div>

        {/* Tree */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <GrandparentsPair grandparentsData={grandparentsData} />

          {/* Connector lines */}
          {members.length > 0 && (
            <>
              <div className="hidden md:block relative w-full max-w-4xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-white/20" style={{ width: `${Math.min(90, members.length * 18)}%` }} />
                <div className="flex justify-between" style={{ padding: `0 ${Math.max(5, 50 - members.length * 5)}%` }}>
                  {members.map((m) => (
                    <div key={`tick-${m.id}`} className="w-px h-6 bg-white/20" />
                  ))}
                </div>
              </div>
              <div className="md:hidden w-px h-4 bg-white/20" />
            </>
          )}

          {/* Children grid */}
          {members.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-5 mt-2 w-full">
              {members.map((child, index) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="flex justify-center"
                >
                  <ChildCard
                    child={child}
                    onEdit={() => setEditingMember(child)}
                    onDelete={() => setDeletingMember(child)}
                    onView={() => {
                      console.log('Opening family nucleus for:', child.name || child.fullName, 'Full object:', child);
                      setModalTab('familia');
                      setFamiliaView('tarjetas');
                      setSelectedMember(child);
                    }}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-white/50 text-sm mb-2">Aun no hay familiares registrados</p>
              <p className="text-white/40 text-xs">Usa el boton de abajo para agregar a los hijos</p>
            </div>
          )}
        </motion.div>

        {/* Add member button */}
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-white/20 text-white/50 hover:bg-white/5 hover:border-white/30 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Agregar hijo/a
          </button>
        </div>

        {/* Stats bar */}
        {members.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 flex flex-wrap justify-center gap-6 sm:gap-10"
          >
            {familyStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40 uppercase tracking-wider mt-1">{stat.label}</p>
                {stat.sub && <p className="text-[11px] text-white/40 mt-0.5">{stat.sub}</p>}
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Selected member detail overlay */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedMember(null)} />
            <motion.div
              className="relative bg-[#1E293B] rounded-2xl shadow-2xl w-full max-h-[96vh] overflow-y-auto mx-2"
              style={{ maxWidth: '1600px' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6 sm:p-8">
                {/* Premium hero banner */}
                {(() => {
                  const sp = selectedMember.spouse
                  const spouseName = sp ? (typeof sp === 'object' ? sp.name : sp) : null
                  const spouseGender = sp && typeof sp === 'object' ? sp.gender : null
                  const getLastName = (fullName) => {
                    if (!fullName) return 'Familia'
                    const parts = fullName.trim().split(' ')
                    if (parts.length >= 2) return parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1]
                    return parts[0]
                  }
                  const memberLastName = selectedMember.lastName || getLastName(selectedMember.name || selectedMember.fullName)
                  const spouseLastName = sp && typeof sp === 'object' && sp.lastName ? sp.lastName : (spouseName ? getLastName(spouseName) : null)

                  let familyTitle
                  if (!spouseLastName) {
                    familyTitle = `Familia ${memberLastName}`
                  } else if (selectedMember.gender === 'M') {
                    familyTitle = `Familia ${memberLastName} ${spouseLastName}`
                  } else if (selectedMember.gender === 'F') {
                    familyTitle = `Familia ${spouseLastName} ${memberLastName}`
                  } else if (spouseGender === 'M') {
                    familyTitle = `Familia ${spouseLastName} ${memberLastName}`
                  } else if (spouseGender === 'F') {
                    familyTitle = `Familia ${memberLastName} ${spouseLastName}`
                  } else {
                    familyTitle = `Familia ${memberLastName} ${spouseLastName}`
                  }

                  // Calculate wedding years for stats
                  let weddingYears = 0
                  if (selectedMember.weddingDate) {
                    const wd = new Date(selectedMember.weddingDate)
                    const now = new Date()
                    weddingYears = now.getFullYear() - wd.getFullYear()
                    if (now.getMonth() < wd.getMonth() || (now.getMonth() === wd.getMonth() && now.getDate() < wd.getDate())) weddingYears--
                    if (weddingYears < 0) weddingYears = 0
                  }

                  // Count total grandchildren
                  const totalGrandchildren = selectedMember.children ? selectedMember.children.reduce((acc, child) => acc + (child.children ? child.children.length : 0), 0) : 0

                  const memberIndex = members.findIndex(m => m.id === selectedMember?.id)
                  // Minimalist neutral colors - white/gray only
                  const hijoColors = ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.08)']
                  const memberColor = hijoColors[memberIndex % hijoColors.length] || 'rgba(255, 255, 255, 0.08)'

                  return (
                    <>
                      <div className="relative -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-6 rounded-t-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #475569 100%)' }}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                        <div className="relative px-6 sm:px-8 pt-10 pb-8 text-center">
                          <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
                            <span className="text-lg">&times;</span>
                          </button>
                          <p className="text-xs text-white/60 font-semibold uppercase tracking-[3px] mb-2">Nucleo familiar</p>
                          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white drop-shadow-lg">{familyTitle}</h2>
                          <div className="flex items-center justify-center gap-3 mt-3">
                            <div className="h-px w-12 bg-white/30" />
                            <Heart className="w-4 h-4 text-white/60 fill-white/40" />
                            <div className="h-px w-12 bg-white/30" />
                          </div>
                        </div>
                      </div>

                      {/* NEW MAGAZINE-STYLE HERO SECTION */}
                      <div className="relative mb-16 rounded-3xl overflow-hidden" style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)',
                        backdropFilter: 'blur(30px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                      }}>
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-5" style={{
                          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                          backgroundSize: '50px 50px'
                        }} />

                        <div className="relative p-10 sm:p-16">
                          {/* Split layout - Photos on left, Info on right */}
                          <div className="flex flex-col lg:flex-row gap-12 items-center">

                            {/* LEFT: Large Photos Side by Side */}
                            <div className="flex gap-8 items-center justify-center flex-shrink-0">
                              {/* Main person - HUGE PHOTO */}
                              <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-white/5 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition" />
                                <div className="relative rounded-full p-3 bg-white/10 ring-4 ring-white/20 backdrop-blur-xl">
                                  {selectedMember.photoURL ? (
                                    <img src={selectedMember.photoURL} alt={selectedMember.name || selectedMember.fullName || 'Miembro'}
                                      className="w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover cursor-pointer transform group-hover:scale-105 transition-transform duration-500"
                                      onClick={() => setLightboxPhoto({ photoURL: selectedMember.photoURL, caption: selectedMember.name || selectedMember.fullName })}
                                    />
                                  ) : (
                                    <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                                      <User className="w-20 h-20 text-white/30" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Heart connector - Elegant */}
                              {selectedMember.spouse && (
                                <div className="flex flex-col items-center">
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center shadow-2xl backdrop-blur-xl ring-2 ring-white/10">
                                    <Heart className="w-8 h-8 text-white/90 fill-white/70 animate-pulse" style={{ animationDuration: '2s' }} />
                                  </div>
                                </div>
                              )}

                              {/* Spouse - HUGE PHOTO */}
                              {selectedMember.spouse && (
                                <div className="relative group">
                                  <div className="absolute -inset-1 bg-gradient-to-l from-white/20 to-white/5 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition" />
                                  <div className="relative rounded-full p-3 bg-white/10 ring-4 ring-white/20 backdrop-blur-xl">
                                    {typeof selectedMember.spouse === 'object' && selectedMember.spouse.photoURL ? (
                                      <img src={selectedMember.spouse.photoURL} alt={selectedMember.spouse.name}
                                        className="w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover cursor-pointer transform group-hover:scale-105 transition-transform duration-500"
                                        onClick={() => setLightboxPhoto({ photoURL: selectedMember.spouse.photoURL, caption: selectedMember.spouse.name })}
                                      />
                                    ) : (
                                      <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                                        <User className="w-20 h-20 text-white/30" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* RIGHT: Information Panel */}
                            <div className="flex-1 text-center lg:text-left space-y-6">
                              {/* Main person info */}
                              <div className="space-y-3">
                                <div>
                                  <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white leading-tight tracking-tight">
                                    {selectedMember.name || selectedMember.fullName || 'Miembro Familiar'}
                                  </h2>
                                  {selectedMember.nickname && (
                                    <p className="text-lg text-white/70 italic mt-2">"{selectedMember.nickname}"</p>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                                  <AgeBadge birthDate={selectedMember.birthDate} deathDate={selectedMember.deathDate} />
                                  {selectedMember.role && (
                                    <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium backdrop-blur-sm ring-1 ring-white/20">
                                      {selectedMember.role}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Spouse info */}
                              {selectedMember.spouse && (
                                <div className="pt-6 border-t border-white/10 space-y-3">
                                  <div>
                                    <h3 className="text-3xl sm:text-4xl font-serif font-bold text-white/90 leading-tight">
                                      {typeof selectedMember.spouse === 'object' ? selectedMember.spouse.name : selectedMember.spouse}
                                    </h3>
                                    {typeof selectedMember.spouse === 'object' && selectedMember.spouse.nickname && (
                                      <p className="text-base text-white/60 italic mt-2">"{selectedMember.spouse.nickname}"</p>
                                    )}
                                  </div>
                                  {typeof selectedMember.spouse === 'object' && (
                                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                                      <AgeBadge birthDate={selectedMember.spouse.birthDate} deathDate={selectedMember.spouse.deathDate} />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tab bar */}
                      <div className="sticky top-0 z-20 -mx-6 sm:-mx-8 px-4 sm:px-6 py-2 bg-white/5 border-y border-white/80 mb-6 shadow-sm">
                        <div className="flex overflow-x-auto gap-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <style>{`.modal-tabs::-webkit-scrollbar { display: none; }`}</style>
                          {[
                            { key: 'familia', label: 'Familia', icon: Users },
                            { key: 'datos', label: 'Datos', icon: Heart },
                            { key: 'momentos', label: 'Momentos', icon: Star },
                            { key: 'galeria', label: 'Galeria', icon: Camera },
                            { key: 'mensajes', label: 'Mensajes', icon: MessageCircle },
                          ].map((tab) => {
                            const TabIcon = tab.icon
                            return (
                            <button
                              key={tab.key}
                              onClick={() => setModalTab(tab.key)}
                              className={`flex items-center gap-1.5 text-sm font-medium py-2.5 px-4 rounded-xl whitespace-nowrap transition-all ${
                                modalTab === tab.key
                                  ? 'bg-white/15 text-white shadow-md'
                                  : 'bg-[#0F172A] text-white/60 hover:text-white hover:bg-[#0F172A]/80 border-4 border-white/80'
                              }`}
                            >
                              <TabIcon className="w-4 h-4" />
                              {tab.label}
                            </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* TAB: Familia */}
                      {modalTab === 'familia' && (
                        <>
                          {/* Quick stats pills + view toggle */}
                          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                            {selectedMember.children?.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold">
                                <Users className="w-3.5 h-3.5" /> {selectedMember.children.length} hijos
                              </span>
                            )}
                            {totalGrandchildren > 0 && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold">
                                <Users className="w-3.5 h-3.5" /> {totalGrandchildren} nietos
                              </span>
                            )}
                            {selectedMember.location && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold">
                                <MapPin className="w-3.5 h-3.5" /> {selectedMember.location}
                              </span>
                            )}
                          </div>

                          {/* View toggle: Tarjetas / Arbol Visual / Arbol Interactivo */}
                          {selectedMember.children?.length > 0 && (
                            <div className="flex items-center justify-center gap-1 mb-6">
                              <div className="inline-flex rounded-xl bg-white/5 border-4 border-white/80 p-1 shadow-sm">
                                <button
                                  onClick={() => setFamiliaView('tarjetas')}
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                    familiaView === 'tarjetas'
                                      ? 'bg-white/15 text-white shadow-md'
                                      : 'text-white/60 hover:text-white'
                                  }`}
                                >
                                  <LayoutGrid className="w-4 h-4" />
                                  <span className="hidden sm:inline">Tarjetas</span>
                                </button>
                                <button
                                  onClick={() => setFamiliaView('arbol-visual')}
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                    familiaView === 'arbol-visual'
                                      ? 'bg-white/15 text-white shadow-md'
                                      : 'text-white/60 hover:text-white'
                                  }`}
                                >
                                  <GitBranch className="w-4 h-4" />
                                  <span className="hidden sm:inline">Arbol</span>
                                </button>
                                <button
                                  onClick={() => setFamiliaView('arbol')}
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                    familiaView === 'arbol'
                                      ? 'bg-white/15 text-white shadow-md'
                                      : 'text-white/60 hover:text-white'
                                  }`}
                                >
                                  <GitBranch className="w-4 h-4" />
                                  <span className="hidden sm:inline">Interactivo</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* TAB: Datos */}
                      {modalTab === 'datos' && (
                        <>
                          {(selectedMember.weddingDate || selectedMember.location) && (
                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6 py-3 px-4 rounded-xl bg-[#0F172A]/80 border-4 border-white/80">
                              {selectedMember.weddingDate && (
                                <div className="flex items-center gap-1.5 text-sm text-white">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span className="font-medium">{formatDate(selectedMember.weddingDate)}</span>
                                </div>
                              )}
                              {selectedMember.weddingPlace && (
                                <div className="flex items-center gap-1.5 text-sm text-white">
                                  <Home className="w-3.5 h-3.5" />
                                  <span className="font-medium">{selectedMember.weddingPlace}</span>
                                </div>
                              )}
                              {selectedMember.location && (
                                <div className="flex items-center gap-1.5 text-sm text-white/70">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span className="font-medium">{selectedMember.location}</span>
                                </div>
                              )}
                              {(() => {
                                if (!selectedMember.weddingDate) return null
                                const wd = new Date(selectedMember.weddingDate)
                                const now = new Date()
                                let y = now.getFullYear() - wd.getFullYear()
                                if (now.getMonth() < wd.getMonth() || (now.getMonth() === wd.getMonth() && now.getDate() < wd.getDate())) y--
                                return y > 0 ? (
                                  <div className="flex items-center gap-1.5 text-sm font-bold text-white/70">
                                    <Heart className="w-3.5 h-3.5" />
                                    <span>{y} años de casados</span>
                                  </div>
                                ) : null
                              })()}
                            </div>
                          )}

                          {selectedMember.bio && (
                            <p className="text-base text-white/70 leading-relaxed mb-4 italic text-center">{selectedMember.bio}</p>
                          )}

                          {!selectedMember.weddingDate && !selectedMember.location && !selectedMember.bio && (
                            <p className="text-sm text-white/40 text-center py-8">No hay datos adicionales registrados.</p>
                          )}
                        </>
                      )}

                      {/* TAB: Familia - Card Tree View (fullscreen) */}
                      {modalTab === 'familia' && familiaView === 'arbol-visual' && selectedMember.children?.length > 0 && (
                        <NucleusCardTree member={selectedMember} onClose={() => setFamiliaView('tarjetas')} />
                      )}

                      {/* TAB: Familia - Interactive Tree View */}
                      {modalTab === 'familia' && familiaView === 'arbol' && selectedMember.children?.length > 0 && (
                        <NucleusTreeView member={selectedMember} />
                      )}

                      {/* TAB: Familia - Cards View */}
                      {modalTab === 'familia' && familiaView === 'tarjetas' && (
                        <>
                      {/* BENTO GRID: Premium Dashboard Style */}
                      {selectedMember.children && selectedMember.children.length > 0 && (
                        <div className="mb-12">
                          {/* Section Header with Stats */}
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <h4 className="text-2xl font-serif font-bold text-white mb-2">
                                Familia & Descendencia
                              </h4>
                              <p className="text-sm text-white/60">
                                {selectedMember.children.filter(c => c && c !== null).length} {selectedMember.children.filter(c => c && c !== null).length === 1 ? 'hijo' : 'hijos'} •
                                {' '}{selectedMember.children.filter(c => c && c !== null).reduce((acc, child) => acc + (child.children ? child.children.filter(gc => gc && gc !== null).length : 0), 0)} nietos
                              </p>
                            </div>
                          </div>

                          {/* Each child gets their own hero section */}
                          <div className="space-y-16">
                            {selectedMember.children.filter(c => c && c !== null).map((child, i) => {
                              const hasChildren = child.children && child.children.length > 0
                              const hasSpouse = child.spouse && (typeof child.spouse === 'object' ? child.spouse.name : child.spouse)

                              return (
                              <div key={i}>
                                {/* Divider decorativo */}
                                {i > 0 && (
                                  <div className="flex items-center gap-4 mb-12 -mt-4">
                                    <div className="flex-1 h-px" style={{
                                      background: 'linear-gradient(to right, transparent, rgba(184, 151, 106, 0.4), transparent)'
                                    }} />
                                    <div className="w-2 h-2 rounded-full" style={{
                                      background: '#B8976A',
                                      boxShadow: '0 0 10px rgba(184, 151, 106, 0.6)'
                                    }} />
                                    <div className="flex-1 h-px" style={{
                                      background: 'linear-gradient(to left, transparent, rgba(184, 151, 106, 0.4), transparent)'
                                    }} />
                                  </div>
                                )}

                                <div className="group/family rounded-3xl p-6 sm:p-8 space-y-8 transition-all duration-500 relative overflow-hidden" style={{
                                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                                  backdropFilter: 'blur(20px)',
                                  border: '2px solid rgba(255, 255, 255, 0.12)',
                                  borderLeftColor: '#B8654A',
                                  borderLeftWidth: '5px',
                                  boxShadow: '0 25px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 6px 0 20px rgba(184, 101, 74, 0.2)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
                                  e.currentTarget.style.borderLeftColor = '#B8976A'
                                  e.currentTarget.style.boxShadow = '0 30px 90px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 6px 0 25px rgba(184, 151, 106, 0.3)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                                  e.currentTarget.style.borderLeftColor = '#B8654A'
                                  e.currentTarget.style.boxShadow = '0 25px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 6px 0 20px rgba(184, 101, 74, 0.2)'
                                }}
                              >
                                {/* HERO SECTION for married children - EXACT COPY of parents card */}
                                {hasSpouse ? (
                                  <div className="relative rounded-3xl overflow-hidden" style={{
                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)',
                                    backdropFilter: 'blur(30px)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderTop: '3px solid',
                                    borderTopColor: '#B8976A',
                                    boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 3px 15px rgba(184, 151, 106, 0.2)'
                                  }}>
                                    {/* Background pattern */}
                                    <div className="absolute inset-0 opacity-5" style={{
                                      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                      backgroundSize: '50px 50px'
                                    }} />

                                    <div className="relative p-10 sm:p-16">
                                      {/* Split layout - Photos on left, Info on right */}
                                      <div className="flex flex-col lg:flex-row gap-12 items-center">

                                        {/* LEFT: Large Photos Side by Side */}
                                        <div className="flex gap-8 items-center justify-center flex-shrink-0">
                                          {/* Child - HUGE PHOTO */}
                                          <div className="relative group">
                                            <div className="absolute -inset-1 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition" style={{
                                              background: 'linear-gradient(135deg, rgba(184, 101, 74, 0.3), rgba(184, 151, 106, 0.2))'
                                            }} />
                                            <div className="relative rounded-full p-3 bg-white/10 backdrop-blur-xl" style={{
                                              boxShadow: '0 0 0 4px rgba(184, 101, 74, 0.2), 0 0 20px rgba(184, 151, 106, 0.3)'
                                            }}>
                                              {child.photoURL ? (
                                                <img src={child.photoURL} alt={child.name}
                                                  className="w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover cursor-pointer transform group-hover:scale-105 transition-transform duration-500"
                                                  onClick={() => setLightboxPhoto({ photoURL: child.photoURL, caption: child.name })}
                                                />
                                              ) : (
                                                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                                                  <User className="w-20 h-20 text-white/30" />
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Heart connector - Elegant */}
                                          {child.spouse && (
                                            <div className="flex flex-col items-center">
                                              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-xl" style={{
                                                background: 'linear-gradient(135deg, rgba(184, 101, 74, 0.2), rgba(184, 151, 106, 0.15))',
                                                boxShadow: '0 0 0 2px rgba(184, 101, 74, 0.3), 0 10px 30px rgba(0,0,0,0.3)'
                                              }}>
                                                <Heart className="w-8 h-8 animate-pulse" style={{
                                                  color: '#B8654A',
                                                  fill: '#B8654A',
                                                  opacity: 0.9,
                                                  animationDuration: '2s',
                                                  filter: 'drop-shadow(0 2px 4px rgba(184, 101, 74, 0.4))'
                                                }} />
                                              </div>
                                            </div>
                                          )}

                                          {/* Spouse - HUGE PHOTO */}
                                          {child.spouse && (
                                            <div className="relative group">
                                              <div className="absolute -inset-1 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition" style={{
                                                background: 'linear-gradient(135deg, rgba(184, 151, 106, 0.3), rgba(107, 144, 128, 0.2))'
                                              }} />
                                              <div className="relative rounded-full p-3 bg-white/10 backdrop-blur-xl" style={{
                                                boxShadow: '0 0 0 4px rgba(184, 151, 106, 0.2), 0 0 20px rgba(107, 144, 128, 0.3)'
                                              }}>
                                                {typeof child.spouse === 'object' && child.spouse.photoURL ? (
                                                  <img src={child.spouse.photoURL} alt={child.spouse.name}
                                                    className="w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover cursor-pointer transform group-hover:scale-105 transition-transform duration-500"
                                                    onClick={() => setLightboxPhoto({ photoURL: child.spouse.photoURL, caption: child.spouse.name })}
                                                  />
                                                ) : (
                                                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                                                    <User className="w-20 h-20 text-white/30" />
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* RIGHT: Information Panel */}
                                        <div className="flex-1 text-center lg:text-left space-y-6">
                                          {/* Child info */}
                                          <div className="space-y-3">
                                            <div>
                                              <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white leading-tight tracking-tight">
                                                {child.name}
                                              </h2>
                                              {child.nickname && (
                                                <p className="text-lg text-white/70 italic mt-2">"{child.nickname}"</p>
                                              )}
                                            </div>
                                            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                                              <AgeBadge birthDate={child.birthDate} deathDate={child.deathDate} />
                                              {child.role && (
                                                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium backdrop-blur-sm ring-1 ring-white/20">
                                                  {child.role}
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Spouse info */}
                                          {child.spouse && (
                                            <div className="pt-6 border-t border-white/10 space-y-3">
                                              <div>
                                                <h3 className="text-3xl sm:text-4xl font-serif font-bold text-white/90 leading-tight">
                                                  {typeof child.spouse === 'object' ? child.spouse.name : child.spouse}
                                                </h3>
                                                {typeof child.spouse === 'object' && child.spouse.nickname && (
                                                  <p className="text-base text-white/60 italic mt-2">"{child.spouse.nickname}"</p>
                                                )}
                                              </div>
                                              {typeof child.spouse === 'object' && (
                                                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                                                  <AgeBadge birthDate={child.spouse.birthDate} deathDate={child.spouse.deathDate} />
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Wedding info */}
                                          {(child.weddingDate || child.weddingPlace) && (
                                            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70 justify-center lg:justify-start">
                                              {child.weddingDate && (
                                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" style={{ color: '#B8976A' }} /> {formatDate(child.weddingDate)}</span>
                                              )}
                                              {child.weddingPlace && (
                                                <span className="flex items-center gap-1"><Home className="w-4 h-4" style={{ color: '#6B9080' }} /> {child.weddingPlace}</span>
                                              )}
                                              {child.weddingDate && (() => {
                                                const wd = new Date(child.weddingDate)
                                                const now = new Date()
                                                let y = now.getFullYear() - wd.getFullYear()
                                                if (now.getMonth() < wd.getMonth() || (now.getMonth() === wd.getMonth() && now.getDate() < wd.getDate())) y--
                                                return y > 0 ? <span className="flex items-center gap-1 font-bold"><Heart className="w-4 h-4" style={{ color: '#B8654A' }} /> {y} años casados</span> : null
                                              })()}
                                            </div>
                                          )}

                                          {/* Bio */}
                                          {(child.bio || (typeof child.spouse === 'object' && child.spouse !== null && child.spouse.bio)) && (
                                            <div className="pt-6 border-t border-white/10 space-y-4">
                                              {child.bio && (
                                                <div>
                                                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{child.name?.split(' ')[0]}</p>
                                                  <p className="text-base text-white/60 italic leading-relaxed">{child.bio}</p>
                                                </div>
                                              )}
                                              {typeof child.spouse === 'object' && child.spouse !== null && child.spouse.bio && (
                                                <div>
                                                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{child.spouse.name?.split(' ')[0]}</p>
                                                  <p className="text-base text-white/60 italic leading-relaxed">{child.spouse.bio}</p>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Hobbies */}
                                          {((child.hobbies && child.hobbies.length > 0) || (typeof child.spouse === 'object' && child.spouse !== null && child.spouse.hobbies && child.spouse.hobbies.length > 0)) && (
                                            <div className="pt-6 border-t border-white/10 space-y-4">
                                              {child.hobbies && child.hobbies.length > 0 && (
                                                <div>
                                                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Hobbies - {child.name?.split(' ')[0]}</p>
                                                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                                                    {child.hobbies.map((hobby, hi) => {
                                                      const colors = ['#B8654A', '#B8976A', '#6B9080']
                                                      const color = colors[hi % colors.length]
                                                      return (
                                                        <span key={hi} className="px-3 py-1.5 rounded-full text-white/80 text-base" style={{
                                                          background: `${color}15`,
                                                          border: `1px solid ${color}30`,
                                                          boxShadow: `0 2px 8px ${color}10`
                                                        }}>
                                                          {hobby}
                                                        </span>
                                                      )
                                                    })}
                                                  </div>
                                                </div>
                                              )}
                                              {typeof child.spouse === 'object' && child.spouse !== null && child.spouse.hobbies && child.spouse.hobbies.length > 0 && (
                                                <div>
                                                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Hobbies - {child.spouse.name?.split(' ')[0]}</p>
                                                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                                                    {child.spouse.hobbies.map((hobby, hi) => {
                                                      const colors = ['#B8654A', '#B8976A', '#6B9080']
                                                      const color = colors[hi % colors.length]
                                                      return (
                                                        <span key={hi} className="px-3 py-1.5 rounded-full text-white/80 text-base" style={{
                                                          background: `${color}15`,
                                                          border: `1px solid ${color}30`,
                                                          boxShadow: `0 2px 8px ${color}10`
                                                        }}>
                                                          {hobby}
                                                        </span>
                                                      )
                                                    })}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Location if not shown above */}
                                          {child.location && (
                                            <div className="pt-6 border-t border-white/10">
                                              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white/70 text-sm" style={{
                                                background: 'rgba(107, 144, 128, 0.1)',
                                                border: '1px solid rgba(107, 144, 128, 0.2)'
                                              }}>
                                                <MapPin className="w-4 h-4" style={{ color: '#6B9080' }} /> {child.location}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-8 rounded-3xl" style={{
                                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                  }}>
                                    <div className="flex items-center gap-6">
                                      <div className="rounded-full p-2 bg-white/5 ring-2 ring-white/10">
                                        {child.photoURL ? (
                                          <img src={child.photoURL} alt={child.name} className="w-24 h-24 rounded-full object-cover" />
                                        ) : (
                                          <div className="w-24 h-24 rounded-full flex items-center justify-center bg-white/5">
                                            <User className="w-12 h-12 text-white/30" />
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-xs uppercase tracking-widest text-white/50 mb-1">{child.role || (child.gender === 'F' ? 'Hija' : child.gender === 'M' ? 'Hijo' : 'Hijo(a)')}</p>
                                        <h3 className="text-2xl font-serif font-bold text-white mb-1">{child.name}</h3>
                                        {child.nickname && <p className="text-sm text-white/60 italic mb-2">"{child.nickname}"</p>}
                                        <AgeBadge birthDate={child.birthDate} deathDate={child.deathDate} />
                                        {child.location && <p className="text-xs text-white/50 mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> {child.location}</p>}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Children of this hijo (nietos) */}
                                {child.children && child.children.length > 0 && (
                                  <div className="px-6 pb-6 pt-4">
                                    <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                      <Users className="w-4 h-4" style={{ color: '#B8976A' }} />
                                      Hijos de {child.name?.split(' ')[0]} ({child.children.filter(c => c && c !== null).length})
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                      {child.children.filter(c => c && c !== null).map((ggc, gi) => {
                                        const nietoHasSpouse = ggc.spouse && (typeof ggc.spouse === 'object' ? ggc.spouse.name : ggc.spouse)

                                        return (
                                        <div key={gi}>
                                          {/* NIETO CASADO - Tarjeta tipo hero más pequeña */}
                                          {nietoHasSpouse ? (
                                            <div className="rounded-3xl overflow-hidden" style={{
                                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                                              backdropFilter: 'blur(20px)',
                                              border: '1.5px solid rgba(255, 255, 255, 0.12)',
                                              borderTop: '2.5px solid',
                                              borderTopColor: '#6B9080',
                                              boxShadow: '0 15px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 2.5px 12px rgba(107, 144, 128, 0.15)'
                                            }}>
                                              {/* Background pattern */}
                                              <div className="absolute inset-0 opacity-5" style={{
                                                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                                backgroundSize: '40px 40px'
                                              }} />

                                              <div className="relative p-6 sm:p-8">
                                                <div className="flex flex-col gap-8">
                                                  {/* Fotos lado a lado - más pequeñas que los papás */}
                                                  <div className="flex gap-6 items-center justify-center">
                                                    {/* Nieto - foto mediana */}
                                                    <div className="relative group">
                                                      <div className="absolute -inset-1 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition" style={{
                                                        background: 'linear-gradient(135deg, rgba(184, 101, 74, 0.25), rgba(184, 151, 106, 0.15))'
                                                      }} />
                                                      <div className="relative rounded-full p-2 bg-white/10 backdrop-blur-xl" style={{
                                                        boxShadow: '0 0 0 2px rgba(184, 101, 74, 0.15), 0 0 15px rgba(184, 151, 106, 0.2)'
                                                      }}>
                                                        {ggc.photoURL ? (
                                                          <img src={ggc.photoURL} alt={ggc.name}
                                                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover cursor-pointer transform group-hover:scale-105 transition-transform duration-500"
                                                            onClick={() => setLightboxPhoto({ photoURL: ggc.photoURL, caption: ggc.name })}
                                                          />
                                                        ) : (
                                                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                                                            <User className="w-14 h-14 text-white/30" />
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>

                                                    {/* Heart connector */}
                                                    <div className="flex flex-col items-center">
                                                      <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl backdrop-blur-xl" style={{
                                                        background: 'linear-gradient(135deg, rgba(184, 101, 74, 0.15), rgba(184, 151, 106, 0.1))',
                                                        boxShadow: '0 0 0 1px rgba(184, 101, 74, 0.25), 0 8px 20px rgba(0,0,0,0.3)'
                                                      }}>
                                                        <Heart className="w-6 h-6 animate-pulse" style={{
                                                          color: '#B8654A',
                                                          fill: '#B8654A',
                                                          opacity: 0.8,
                                                          animationDuration: '2s',
                                                          filter: 'drop-shadow(0 2px 3px rgba(184, 101, 74, 0.3))'
                                                        }} />
                                                      </div>
                                                    </div>

                                                    {/* Esposa/Esposo - foto mediana */}
                                                    <div className="relative group">
                                                      <div className="absolute -inset-1 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition" style={{
                                                        background: 'linear-gradient(135deg, rgba(184, 151, 106, 0.25), rgba(107, 144, 128, 0.15))'
                                                      }} />
                                                      <div className="relative rounded-full p-2 bg-white/10 backdrop-blur-xl" style={{
                                                        boxShadow: '0 0 0 2px rgba(184, 151, 106, 0.15), 0 0 15px rgba(107, 144, 128, 0.2)'
                                                      }}>
                                                        {typeof ggc.spouse === 'object' && ggc.spouse.photoURL ? (
                                                          <img src={ggc.spouse.photoURL} alt={ggc.spouse.name}
                                                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover cursor-pointer transform group-hover:scale-105 transition-transform duration-500"
                                                            onClick={() => setLightboxPhoto({ photoURL: ggc.spouse.photoURL, caption: ggc.spouse.name })}
                                                          />
                                                        ) : (
                                                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                                                            <User className="w-14 h-14 text-white/30" />
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {/* Nombres e info */}
                                                  <div className="text-center space-y-4">
                                                    {/* Nieto info */}
                                                    <div className="space-y-2">
                                                      <div>
                                                        <p className="text-xs uppercase tracking-widest text-white/50 mb-1">
                                                          {ggc.gender === 'F' ? 'Nieta' : ggc.gender === 'M' ? 'Nieto' : 'Nieto(a)'}
                                                        </p>
                                                        <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
                                                          {ggc.name}
                                                        </h3>
                                                        {ggc.nickname && (
                                                          <p className="text-sm text-white/70 italic mt-1">"{ggc.nickname}"</p>
                                                        )}
                                                      </div>
                                                      <div className="flex flex-wrap gap-2 justify-center">
                                                        <AgeBadge birthDate={ggc.birthDate} deathDate={ggc.deathDate} />
                                                        {ggc.location && (
                                                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white/70 text-xs" style={{
                                                            background: 'rgba(107, 144, 128, 0.08)',
                                                            border: '1px solid rgba(107, 144, 128, 0.15)'
                                                          }}>
                                                            <MapPin className="w-3 h-3" style={{ color: '#6B9080' }} /> {ggc.location}
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>

                                                    {/* Spouse info */}
                                                    <div className="pt-4 border-t border-white/10 space-y-2">
                                                      <div>
                                                        <p className="text-xs uppercase tracking-widest text-white/50 mb-1">Cónyuge</p>
                                                        <h4 className="text-xl sm:text-2xl font-serif font-bold text-white/90 leading-tight">
                                                          {typeof ggc.spouse === 'object' ? ggc.spouse.name : ggc.spouse}
                                                        </h4>
                                                        {typeof ggc.spouse === 'object' && ggc.spouse.nickname && (
                                                          <p className="text-sm text-white/60 italic mt-1">"{ggc.spouse.nickname}"</p>
                                                        )}
                                                      </div>
                                                      {typeof ggc.spouse === 'object' && (
                                                        <div className="flex flex-wrap gap-2 justify-center">
                                                          <AgeBadge birthDate={ggc.spouse.birthDate} deathDate={ggc.spouse.deathDate} />
                                                        </div>
                                                      )}
                                                    </div>

                                                    {/* Wedding info */}
                                                    {(ggc.weddingDate || ggc.weddingPlace) && (
                                                      <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/70">
                                                        {ggc.weddingDate && (
                                                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" style={{ color: '#B8976A' }} /> {formatDate(ggc.weddingDate)}</span>
                                                        )}
                                                        {ggc.weddingPlace && (
                                                          <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5" style={{ color: '#6B9080' }} /> {ggc.weddingPlace}</span>
                                                        )}
                                                        {ggc.weddingDate && (() => {
                                                          const wd = new Date(ggc.weddingDate)
                                                          const now = new Date()
                                                          let y = now.getFullYear() - wd.getFullYear()
                                                          if (now.getMonth() < wd.getMonth() || (now.getMonth() === wd.getMonth() && now.getDate() < wd.getDate())) y--
                                                          return y > 0 ? <span className="flex items-center gap-1 font-bold"><Heart className="w-3.5 h-3.5" style={{ color: '#B8654A' }} /> {y} años casados</span> : null
                                                        })()}
                                                      </div>
                                                    )}

                                                    {/* Bio */}
                                                    {(ggc.bio || (typeof ggc.spouse === 'object' && ggc.spouse !== null && ggc.spouse.bio)) && (
                                                      <div className="pt-4 border-t border-white/10 space-y-3">
                                                        {ggc.bio && (
                                                          <div>
                                                            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">{ggc.name?.split(' ')[0]}</p>
                                                            <p className="text-base text-white/60 italic leading-relaxed">{ggc.bio}</p>
                                                          </div>
                                                        )}
                                                        {typeof ggc.spouse === 'object' && ggc.spouse !== null && ggc.spouse.bio && (
                                                          <div>
                                                            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">{ggc.spouse.name?.split(' ')[0]}</p>
                                                            <p className="text-base text-white/60 italic leading-relaxed">{ggc.spouse.bio}</p>
                                                          </div>
                                                        )}
                                                      </div>
                                                    )}

                                                    {/* Hobbies */}
                                                    {((ggc.hobbies && ggc.hobbies.length > 0) || (typeof ggc.spouse === 'object' && ggc.spouse !== null && ggc.spouse.hobbies && ggc.spouse.hobbies.length > 0)) && (
                                                      <div className="pt-4 border-t border-white/10 space-y-3">
                                                        {ggc.hobbies && ggc.hobbies.length > 0 && (
                                                          <div>
                                                            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Hobbies - {ggc.name?.split(' ')[0]}</p>
                                                            <div className="flex flex-wrap gap-2 justify-center">
                                                              {ggc.hobbies.map((hobby, hi) => {
                                                                const colors = ['#B8654A', '#B8976A', '#6B9080']
                                                                const color = colors[hi % colors.length]
                                                                return (
                                                                  <span key={hi} className="px-3 py-1.5 rounded-full text-white/80 text-base" style={{
                                                                    background: `${color}12`,
                                                                    border: `1px solid ${color}25`,
                                                                    boxShadow: `0 1px 4px ${color}08`
                                                                  }}>
                                                                    {hobby}
                                                                  </span>
                                                                )
                                                              })}
                                                            </div>
                                                          </div>
                                                        )}
                                                        {typeof ggc.spouse === 'object' && ggc.spouse !== null && ggc.spouse.hobbies && ggc.spouse.hobbies.length > 0 && (
                                                          <div>
                                                            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Hobbies - {ggc.spouse.name?.split(' ')[0]}</p>
                                                            <div className="flex flex-wrap gap-2 justify-center">
                                                              {ggc.spouse.hobbies.map((hobby, hi) => {
                                                                const colors = ['#B8654A', '#B8976A', '#6B9080']
                                                                const color = colors[hi % colors.length]
                                                                return (
                                                                  <span key={hi} className="px-3 py-1.5 rounded-full text-white/80 text-base" style={{
                                                                    background: `${color}12`,
                                                                    border: `1px solid ${color}25`,
                                                                    boxShadow: `0 1px 4px ${color}08`
                                                                  }}>
                                                                    {hobby}
                                                                  </span>
                                                                )
                                                              })}
                                                            </div>
                                                          </div>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            /* NIETO SOLTERO - Tarjeta normal */
                                            <div className="rounded-3xl shadow-xl overflow-hidden relative group/ggc" style={{
                                              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)',
                                              backdropFilter: 'blur(20px)',
                                              border: '1.5px solid rgba(255, 255, 255, 0.12)',
                                              borderLeft: '3px solid',
                                              borderLeftColor: '#B8976A',
                                              boxShadow: '0 15px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 3px 0 10px rgba(184, 151, 106, 0.15)'
                                            }}>
                                              {/* Move button */}
                                              <button
                                                onClick={() => setMovingPerson({ person: ggc, parentId: selectedMember.id, childIndex: i, grandchildIndex: gi })}
                                                className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 shadow-lg text-white/70 transition opacity-0 group-hover/ggc:opacity-100 z-10 backdrop-blur-sm"
                                                title="Mover"
                                              >
                                                <ArrowRightLeft className="w-4 h-4" />
                                              </button>

                                              {/* Header bar */}
                                              <div className="px-6 py-4 border-b border-white/10" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                                                <p className="text-sm font-bold uppercase tracking-wider text-white/60">
                                                  {ggc.gender === 'F' ? 'Nieta' : ggc.gender === 'M' ? 'Nieto' : 'Nieto(a)'}
                                                </p>
                                              </div>

                                              {/* Single person */}
                                              <div className="p-6">
                                                <div className="flex items-center gap-5">
                                                  <div className="rounded-full p-2 bg-white/5 ring-2 ring-white/10 flex-shrink-0">
                                                    {ggc.photoURL ? (
                                                      <img src={ggc.photoURL} alt={ggc.name} className="w-20 h-20 rounded-full object-cover cursor-pointer" onClick={() => setLightboxPhoto({ photoURL: ggc.photoURL, caption: ggc.name })} />
                                                    ) : (
                                                      <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/5">
                                                        <User className="w-10 h-10 text-white/30" />
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <p className="text-lg font-serif font-bold text-white truncate">{ggc.name}</p>
                                                    {ggc.nickname && <p className="text-sm text-white/70 italic mt-0.5">"{ggc.nickname}"</p>}
                                                    <AgeBadge birthDate={ggc.birthDate} deathDate={ggc.deathDate} />
                                                    {ggc.location && (
                                                      <p className="text-xs text-white/70 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {ggc.location}</p>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Bio */}
                                                {ggc.bio && (
                                                  <div className="mt-4 pt-4 border-t border-white/10">
                                                    <p className="text-base text-white/60 italic leading-relaxed">{ggc.bio}</p>
                                                  </div>
                                                )}

                                                {/* Hobbies */}
                                                {ggc.hobbies && ggc.hobbies.length > 0 && (
                                                  <div className="mt-4 pt-4 border-t border-white/10">
                                                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Hobbies</p>
                                                    <div className="flex flex-wrap gap-2">
                                                      {ggc.hobbies.map((hobby, hi) => {
                                                        const colors = ['#B8654A', '#B8976A', '#6B9080']
                                                        const color = colors[hi % colors.length]
                                                        return (
                                                          <span key={hi} className="px-3 py-1.5 rounded-full text-white/80 text-base" style={{
                                                            background: `${color}12`,
                                                            border: `1px solid ${color}25`,
                                                            boxShadow: `0 1px 4px ${color}08`
                                                          }}>
                                                            {hobby}
                                                          </span>
                                                        )
                                                      })}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {/* Bisnietos - Se muestra para TODOS los nietos (casados o solteros) */}
                                          {ggc.children && ggc.children.length > 0 && (
                                            <div className="mt-6 rounded-2xl p-5" style={{
                                              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
                                              backdropFilter: 'blur(10px)',
                                              border: '1px solid rgba(255, 255, 255, 0.08)'
                                            }}>
                                              <p className="text-xs font-bold uppercase tracking-wider mb-4 text-white/70 flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5" style={{ color: '#B8976A' }} />
                                                Hijos de {ggc.name?.split(' ')[0]} ({ggc.children.filter(c => c && c !== null).length})
                                              </p>
                                              <div className="space-y-3">
                                                {ggc.children.filter(c => c && c !== null).map((bn, bi) => (
                                                  <div key={bi} className="p-4 rounded-xl border bg-white/5 border-white/10 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                      <PersonCircle name={bn.name} photo={bn.photoURL} size="md" onClick={() => setLightboxPhoto({ photoURL: bn.photoURL, caption: bn.name })} />
                                                      <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-white truncate">{bn.name}</p>
                                                        {bn.nickname && <p className="text-xs text-white/60 italic">"{bn.nickname}"</p>}
                                                        <AgeBadge birthDate={bn.birthDate} deathDate={bn.deathDate} />
                                                      </div>
                                                      {bn.spouse && (
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                          <Heart className="w-3 h-3" style={{ color: '#B8654A', opacity: 0.7 }} />
                                                          <span className="text-xs text-white/60 truncate max-w-[100px]">{typeof bn.spouse === 'object' ? bn.spouse.name : bn.spouse}</span>
                                                        </div>
                                                      )}
                                                    </div>

                                                    {/* Bio del bisnieto y cónyuge */}
                                                    {(bn.bio || (typeof bn.spouse === 'object' && bn.spouse !== null && bn.spouse.bio)) && (
                                                      <div className="pt-3 border-t border-white/10 space-y-2">
                                                        {bn.bio && (
                                                          <div>
                                                            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">{bn.name?.split(' ')[0]}</p>
                                                            <p className="text-base text-white/60 italic leading-relaxed">{bn.bio}</p>
                                                          </div>
                                                        )}
                                                        {typeof bn.spouse === 'object' && bn.spouse !== null && bn.spouse.bio && (
                                                          <div>
                                                            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">{bn.spouse.name?.split(' ')[0]}</p>
                                                            <p className="text-base text-white/60 italic leading-relaxed">{bn.spouse.bio}</p>
                                                          </div>
                                                        )}
                                                      </div>
                                                    )}

                                                    {/* Hobbies del bisnieto y cónyuge */}
                                                    {((bn.hobbies && bn.hobbies.length > 0) || (typeof bn.spouse === 'object' && bn.spouse !== null && bn.spouse.hobbies && bn.spouse.hobbies.length > 0)) && (
                                                      <div className="pt-3 border-t border-white/10 space-y-2">
                                                        {bn.hobbies && bn.hobbies.length > 0 && (
                                                          <div>
                                                            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Hobbies - {bn.name?.split(' ')[0]}</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                              {bn.hobbies.map((hobby, hi) => {
                                                                const colors = ['#B8654A', '#B8976A', '#6B9080']
                                                                const color = colors[hi % colors.length]
                                                                return (
                                                                  <span key={hi} className="px-3 py-1.5 rounded-full text-white/80 text-base" style={{
                                                                    background: `${color}10`,
                                                                    border: `1px solid ${color}20`,
                                                                    boxShadow: `0 1px 3px ${color}05`
                                                                  }}>
                                                                    {hobby}
                                                                  </span>
                                                                )
                                                              })}
                                                            </div>
                                                          </div>
                                                        )}
                                                        {typeof bn.spouse === 'object' && bn.spouse !== null && bn.spouse.hobbies && bn.spouse.hobbies.length > 0 && (
                                                          <div>
                                                            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Hobbies - {bn.spouse.name?.split(' ')[0]}</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                              {bn.spouse.hobbies.map((hobby, hi) => {
                                                                const colors = ['#B8654A', '#B8976A', '#6B9080']
                                                                const color = colors[hi % colors.length]
                                                                return (
                                                                  <span key={hi} className="px-3 py-1.5 rounded-full text-white/80 text-base" style={{
                                                                    background: `${color}10`,
                                                                    border: `1px solid ${color}20`,
                                                                    boxShadow: `0 1px 3px ${color}05`
                                                                  }}>
                                                                    {hobby}
                                                                  </span>
                                                                )
                                                              })}
                                                            </div>
                                                          </div>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}
                                </div>
                              </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                        </>
                      )}

                      {/* TAB: Momentos */}
                      {modalTab === 'momentos' && selectedMember.moments && selectedMember.moments.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-sm font-serif font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Star className="w-4 h-4 text-white/70" />
                            Momentos Importantes
                          </h4>
                          <div className="space-y-3">
                            {selectedMember.moments.map((m, i) => (
                              <div key={i} className="flex gap-3 p-3 rounded-xl bg-[#0F172A] border-4 border-white/80 shadow-sm relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.10))' }} />
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 ml-1">
                                  <Star className="w-5 h-5 text-white/70" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{m.title}</p>
                                  {m.date && <p className="text-[11px] text-white/70 font-medium">{formatDate(m.date)}</p>}
                                  {m.description && <p className="text-xs text-white/70 mt-0.5">{m.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {modalTab === 'momentos' && (!selectedMember.moments || selectedMember.moments.length === 0) && (
                        <p className="text-sm text-white/40 text-center py-8">No hay momentos registrados.</p>
                      )}

                      {/* TAB: Galeria - shows ALL photos from entire family nucleus */}
                      {modalTab === 'galeria' && (() => {
                        // Collect all photos from the entire nucleus
                        const allPhotos = []
                        const addPhotos = (person, label) => {
                          if (person.gallery && person.gallery.length > 0) {
                            person.gallery.forEach(g => allPhotos.push({ ...g, owner: label || person.name?.split(' ')[0] }))
                          }
                        }
                        addPhotos(selectedMember, selectedMember.name?.split(' ')[0])
                        if (selectedMember.spouse && typeof selectedMember.spouse === 'object') {
                          addPhotos(selectedMember.spouse, selectedMember.spouse.name?.split(' ')[0])
                        }
                        const walkPhotos = (children) => {
                          (children || []).filter(c => c && c !== null).forEach(child => {
                            addPhotos(child, child.name?.split(' ')[0])
                            if (child.spouse && typeof child.spouse === 'object') addPhotos(child.spouse, child.spouse.name?.split(' ')[0])
                            if (child.children) walkPhotos(child.children)
                          })
                        }
                        if (selectedMember.children) {
                          walkPhotos(selectedMember.children)
                        }

                        if (allPhotos.length === 0) return (
                          <p className="text-sm text-white/40 text-center py-8">No hay fotos en la galeria.</p>
                        )

                        // Group by owner
                        const grouped = {}
                        allPhotos.forEach(p => {
                          if (!grouped[p.owner]) grouped[p.owner] = []
                          grouped[p.owner].push(p)
                        })

                        return (
                          <div className="mb-8 space-y-6">
                            {Object.entries(grouped).map(([owner, photos]) => (
                              <div key={owner}>
                                <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                  <Camera className="w-3.5 h-3.5" />
                                  Fotos de {owner} ({photos.length})
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {photos.map((g, i) => (
                                    <div key={i} className="rounded-xl overflow-hidden border-4 border-white/80 shadow-sm bg-[#0F172A] cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all" onClick={() => g.photoURL && setLightboxPhoto(g)}>
                                      {g.photoURL ? (
                                        <img src={g.photoURL} alt={g.caption} className="w-full h-40 object-cover" />
                                      ) : (
                                        <div className="w-full h-40 bg-gradient-to-br from-white/10/20 to-white/5/20 flex items-center justify-center">
                                          <Camera className="w-8 h-8 text-white/70/40" />
                                        </div>
                                      )}
                                      {g.caption && <p className="text-[11px] text-white/70 p-2 text-center">{g.caption}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })()}

                      {/* TAB: Mensajes */}
                      {modalTab === 'mensajes' && selectedMember.messages && selectedMember.messages.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-sm font-serif font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-white/70" />
                            Voces de la Familia
                          </h4>
                          <div className="space-y-3">
                            {selectedMember.messages.map((msg, i) => (
                              <div key={i} className="p-4 rounded-xl bg-[#0F172A] border-4 border-white/80 shadow-sm relative">
                                <span className="absolute top-2 left-3 text-4xl font-serif text-white/70/15 leading-none select-none">"</span>
                                <div className="flex items-center gap-2 mb-2 relative">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center shadow-sm">
                                    <span className="text-white text-[11px] font-bold">{(msg.author || '?')[0].toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-white">{msg.author}</p>
                                    {msg.date && <p className="text-[11px] text-white/40">{formatDate(msg.date)}</p>}
                                  </div>
                                </div>
                                <p className="text-sm text-white/80 italic ml-10 relative">"{msg.message}"</p>
                                <span className="absolute bottom-1 right-4 text-4xl font-serif text-white/70/15 leading-none select-none rotate-180">"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {modalTab === 'mensajes' && (!selectedMember.messages || selectedMember.messages.length === 0) && (
                        <p className="text-sm text-white/40 text-center py-8">No hay mensajes registrados.</p>
                      )}

                      {/* Actions footer - sticky frosted glass */}
                      <div className="sticky bottom-0 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 px-6 sm:px-8 py-4 bg-[#1E293B]/90 backdrop-blur-md border-t border-white/80">
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setSelectedMember(null); setEditingMember(selectedMember); }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/15 text-white hover:bg-white/20 transition text-sm font-medium shadow-md"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => { setSelectedMember(null); setDeletingMember(selectedMember); }}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition text-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
            onClick={() => setLightboxPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxPhoto(null)}
                className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition text-lg"
              >
                &times;
              </button>
              <img src={lightboxPhoto.photoURL} alt={lightboxPhoto.caption} className="w-full max-h-[80vh] object-contain bg-black" />
              {(lightboxPhoto.caption || lightboxPhoto.owner) && (
                <div className="bg-[#0F172A] p-4">
                  {lightboxPhoto.caption && <p className="text-base font-serif font-bold text-white">{lightboxPhoto.caption}</p>}
                  {lightboxPhoto.owner && <p className="text-xs text-white/70 mt-1">Subida por {lightboxPhoto.owner}</p>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deletingMember && (
          <DeleteConfirm
            member={deletingMember}
            onConfirm={handleDeleteMember}
            onCancel={() => setDeletingMember(null)}
          />
        )}
      </AnimatePresence>

      {/* Move Modal */}
      <AnimatePresence>
        {movingPerson && (
          <MoveModal
            person={movingPerson.person}
            members={members}
            currentParentId={movingPerson.parentId}
            isDeepNested={movingPerson.grandchildIndex !== undefined}
            onMove={handleMovePerson}
            onCancel={() => setMovingPerson(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <FamilyMemberForm
        isOpen={editingMember !== null}
        onClose={() => setEditingMember(null)}
        memberData={editingMember}
        onSave={handleSaveMember}
      />

      {/* Create Modal */}
      <FamilyMemberForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        memberData={null}
        onSave={handleSaveMember}
      />
    </section>
  )
}
