import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Users, User, Plus, Pencil, Trash2, Eye, AlertTriangle, ArrowRightLeft, Calendar, Home, MapPin, Star, Camera, MessageCircle } from 'lucide-react'
import { grandparents as defaultGrandparents } from '../data/familyData'
import { getFamilyMembers, saveFamilyMember, deleteFamilyMember, getGrandparents } from '../firebase/familyService'
import FamilyMemberForm from './FamilyMemberForm'

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
        ? 'bg-[#B8943E]/15 text-[#B8943E]'
        : 'bg-[#7A9E7E]/15 text-[#7A9E7E]'
    }`}>
      {result.deceased ? `${result.age} años` : `${result.age} años`}
    </span>
  )
}

function PersonCircle({ name, photo, size = 'md' }) {
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
        photo ? '' : 'bg-gradient-to-br from-[#C4704B] to-[#B8943E]'
      }`}
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
      <div className="flex items-center gap-6 sm:gap-10">
        <div className="flex flex-col items-center gap-1.5">
          <PersonCircle name={grandfather.fullName || grandfather.name} photo={grandfather.photoURL || grandfather.photo} size="lg" />
          <p className="text-lg font-serif font-bold text-[#5D4037] text-center leading-tight">{grandfather.fullName || grandfather.name}</p>
          {grandfather.nickname && <p className="text-xs text-[#C4704B] font-medium italic">"{grandfather.nickname}"</p>}
          <p className="text-xs text-[#7A9E7E] font-medium">{grandfather.role}</p>
          <AgeBadge birthDate={grandfather.birthDate} deathDate={grandfather.deathDate} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Heart className="w-8 h-8 text-[#C4704B] fill-[#C4704B]" />
          {weddingYear && <span className="text-xs text-[#B8943E] font-medium">{weddingYear}</span>}
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <PersonCircle name={grandmother.fullName || grandmother.name} photo={grandmother.photoURL || grandmother.photo} size="lg" />
          <p className="text-lg font-serif font-bold text-[#5D4037] text-center leading-tight">{grandmother.fullName || grandmother.name}</p>
          {grandmother.nickname && <p className="text-xs text-[#C4704B] font-medium italic">"{grandmother.nickname}"</p>}
          <p className="text-xs text-[#7A9E7E] font-medium">{grandmother.role}</p>
          <AgeBadge birthDate={grandmother.birthDate} deathDate={grandmother.deathDate} />
        </div>
      </div>
      <div className="w-px h-12 bg-[#C4704B]/40 mt-4" />
    </div>
  )
}

function ChildCard({ child, onEdit, onDelete, onView }) {
  const spouse = child.spouse
  const hasSpouse = spouse && (typeof spouse === 'object' ? spouse.name : spouse)

  return (
    <motion.div
      layout
      className="bg-[#FAF6EE] rounded-2xl shadow-md p-5 sm:p-6 border border-[#C4704B]/10 hover:shadow-lg transition-shadow relative group cursor-pointer"
      style={{ width: hasSpouse ? '340px' : '200px', maxWidth: '100%' }}
      whileHover={{ scale: 1.02 }}
      onClick={onView}
    >
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 hover:bg-[#B8943E]/10 shadow text-[#B8943E] transition"
          title="Editar"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 hover:bg-red-50 shadow text-red-400 hover:text-red-600 transition"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {child.role && (
        <span className="absolute -top-2 left-3 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7A9E7E]/10 text-[#7A9E7E] border border-[#7A9E7E]/20">
          {child.role}
        </span>
      )}

      {/* Couple layout */}
      <div className="flex items-start justify-center gap-3">
        {/* Main person */}
        <div className="flex flex-col items-center text-center min-w-0 flex-1">
          <PersonCircle name={child.name} photo={child.photoURL || child.photo} size="xl" />
          <p className="text-sm font-bold text-[#5D4037] leading-tight mt-2 line-clamp-2">
            {child.name}
          </p>
          {child.nickname && (
            <p className="text-xs text-[#C4704B] font-medium italic mt-0.5">"{child.nickname}"</p>
          )}
          <div className="mt-1">
            <AgeBadge birthDate={child.birthDate} deathDate={child.deathDate} />
          </div>
        </div>

        {/* Heart connector */}
        {hasSpouse && (
          <>
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-12">
              <Heart className="w-5 h-5 text-[#C4704B] fill-[#C4704B]" />
            </div>

            {/* Spouse */}
            <div className="flex flex-col items-center text-center min-w-0 flex-1">
              {typeof spouse === 'object' ? (
                <>
                  <PersonCircle name={spouse.name} photo={spouse.photoURL} size="xl" />
                  <p className="text-sm font-bold text-[#5D4037] leading-tight mt-2 line-clamp-2">
                    {spouse.name}
                  </p>
                  {spouse.nickname && (
                    <p className="text-xs text-[#C4704B] font-medium italic mt-0.5">"{spouse.nickname}"</p>
                  )}
                  <div className="mt-1">
                    <AgeBadge birthDate={spouse.birthDate} deathDate={spouse.deathDate} />
                  </div>
                </>
              ) : (
                <>
                  <PersonCircle name={spouse} photo={null} size="xl" />
                  <p className="text-sm font-bold text-[#5D4037] leading-tight mt-2 line-clamp-2">
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
          <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-[#C4704B]/10 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-[#5D4037]/70">
              <Users className="w-3.5 h-3.5 text-[#B8943E]" />
              {hijos} hijos
            </span>
            {yernos > 0 && (
              <span className="text-xs text-[#E8956D] font-medium">{yernos} yernos/nueras</span>
            )}
            {nietos > 0 && (
              <span className="text-xs text-[#7A9E7E] font-medium">{nietos} nietos</span>
            )}
            {yernosNietos > 0 && (
              <span className="text-xs text-[#B8943E] font-medium">{yernosNietos} parejas</span>
            )}
            {bisnietos > 0 && (
              <span className="text-xs text-[#C4704B] font-medium">{bisnietos} bisnietos</span>
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
        className="relative bg-[#FFF8F0] rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-serif font-bold text-[#5D4037] mb-2">Eliminar familiar</h3>
        <p className="text-sm text-[#5D4037]/70 mb-6">
          ¿Estas seguro de eliminar a <strong>{member.name}</strong>? Esta accion no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-[#C4704B]/20 text-[#5D4037] hover:bg-[#FAF6EE] transition text-sm font-medium"
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
    (m.children || []).forEach((c, ci) => {
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
        className="relative bg-[#FFF8F0] rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="w-12 h-12 rounded-full bg-[#7A9E7E]/10 flex items-center justify-center mx-auto mb-4">
          <ArrowRightLeft className="w-6 h-6 text-[#7A9E7E]" />
        </div>
        <h3 className="text-lg font-serif font-bold text-[#5D4037] mb-1 text-center">Mover a {person.name}</h3>
        <p className="text-xs text-[#5D4037]/60 text-center mb-4">Selecciona donde quieres ubicar a esta persona</p>

        <div className="space-y-2 mb-6">
          {destinations.map((dest) => (
            <button
              key={dest.id}
              type="button"
              onClick={() => setSelectedTarget(dest)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition text-sm ${
                selectedTarget?.id === dest.id
                  ? 'border-[#7A9E7E] bg-[#7A9E7E]/10 text-[#5D4037] font-semibold'
                  : 'border-[#C4704B]/10 bg-white hover:bg-[#FAF6EE] text-[#5D4037]/80'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#B8943E] flex-shrink-0" />
                <span>Como hijo de <strong>{dest.name}</strong></span>
              </span>
            </button>
          ))}
          {destinations.length === 0 && (
            <p className="text-sm text-[#5D4037]/50 text-center py-4">No hay otros familiares disponibles</p>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-[#C4704B]/20 text-[#5D4037] hover:bg-[#FAF6EE] transition text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => selectedTarget && onMove(selectedTarget)}
            disabled={!selectedTarget}
            className="px-5 py-2 rounded-lg bg-[#7A9E7E] text-white hover:bg-[#7A9E7E]/90 transition text-sm font-medium disabled:opacity-40"
          >
            Mover aqui
          </button>
        </div>
      </motion.div>
    </motion.div>
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
  const [lightboxPhoto, setLightboxPhoto] = useState(null)

  useEffect(() => {
    loadMembers()
    loadGrandparents()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      const { memberId } = e.detail
      if (memberId) {
        const member = members.find(m => m.id === memberId)
        if (member) {
          setModalTab('familia')
          setSelectedMember(member)
        }
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
    arr.sort((a, b) => {
      if (!a.birthDate && !b.birthDate) return 0
      if (!a.birthDate) return 1
      if (!b.birthDate) return -1
      return a.birthDate.localeCompare(b.birthDate)
    })
    arr.forEach(p => { if (p.children) sortByBirth(p.children) })
    return arr
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
    setEditingMember(null)
    setShowCreateForm(false)
    await loadMembers()
  }

  const handleDeleteMember = async () => {
    if (deletingMember?.id) {
      await deleteFamilyMember(deletingMember.id)
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
    <section id="arbol" className="py-20 px-3 sm:px-6 lg:px-10 bg-[#FDF8F0]">
      <div className="w-full">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#5D4037] mb-3">
            Nuestro Arbol Familiar
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-[#C4704B]/40" />
            <Heart className="w-5 h-5 text-[#C4704B] fill-[#C4704B]/30" />
            <div className="h-px w-12 bg-[#C4704B]/40" />
          </div>
          <p className="mt-4 text-[#5D4037]/60 max-w-lg mx-auto text-sm sm:text-base">
            Desde las raices hasta las nuevas ramas, cada miembro es parte esencial de esta historia.
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
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-[#C4704B]/30" style={{ width: `${Math.min(90, members.length * 18)}%` }} />
                <div className="flex justify-between" style={{ padding: `0 ${Math.max(5, 50 - members.length * 5)}%` }}>
                  {members.map((m) => (
                    <div key={`tick-${m.id}`} className="w-px h-6 bg-[#C4704B]/30" />
                  ))}
                </div>
              </div>
              <div className="md:hidden w-px h-4 bg-[#C4704B]/30" />
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
                    onView={() => { setModalTab('familia'); setSelectedMember(child); }}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-[#5D4037]/50 text-sm mb-2">Aun no hay familiares registrados</p>
              <p className="text-[#5D4037]/40 text-xs">Usa el boton de abajo para agregar a los hijos</p>
            </div>
          )}
        </motion.div>

        {/* Add member button */}
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-[#7A9E7E]/40 text-[#7A9E7E] hover:bg-[#7A9E7E]/5 hover:border-[#7A9E7E] transition font-medium"
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
                <p className="text-2xl sm:text-3xl font-bold text-[#C4704B]">{stat.value}</p>
                <p className="text-xs text-[#5D4037]/50 uppercase tracking-wider mt-1">{stat.label}</p>
                {stat.sub && <p className="text-[11px] text-[#7A9E7E] mt-0.5">{stat.sub}</p>}
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
              className="relative bg-[#FFF8F0] rounded-2xl shadow-2xl max-w-7xl w-full max-h-[96vh] overflow-y-auto mx-2"
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
                    if (!fullName) return ''
                    const parts = fullName.trim().split(' ')
                    if (parts.length >= 2) return parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1]
                    return parts[0]
                  }
                  const memberLastName = getLastName(selectedMember.name)
                  const spouseLastName = spouseName ? getLastName(spouseName) : null

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

                  return (
                    <>
                      <div className="relative -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-6 rounded-t-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #5D4037, #C4704B, #B8943E)' }}>
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

                      {/* Couple cards */}
                      <div className="flex items-start justify-center gap-4 sm:gap-10 mb-8 px-2">
                        {/* Main person card */}
                        <div className="flex-1 max-w-[220px] bg-white rounded-2xl shadow-xl p-4 text-center border border-[#E0D5C8]/50">
                          <div className="mb-3">
                            <PersonCircle name={selectedMember.name} photo={selectedMember.photoURL} size="xxl" />
                          </div>
                          <h3 className="text-base font-serif font-bold text-[#5D4037]">{selectedMember.name}</h3>
                          {selectedMember.nickname && (
                            <p className="text-xs text-[#C4704B] font-medium italic">"{selectedMember.nickname}"</p>
                          )}
                          <AgeBadge birthDate={selectedMember.birthDate} deathDate={selectedMember.deathDate} />
                          {selectedMember.role && (
                            <span className="inline-block mt-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7A9E7E]/10 text-[#7A9E7E]">
                              {selectedMember.role}
                            </span>
                          )}
                        </div>

                        {/* Heart connector */}
                        {selectedMember.spouse && (
                          <>
                            <div className="flex flex-col items-center pt-4 flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C4704B] to-[#B8943E] flex items-center justify-center shadow-lg">
                                <Heart className="w-5 h-5 text-white fill-white" />
                              </div>
                            </div>

                            {/* Spouse card */}
                            <div className="flex-1 max-w-[220px] bg-white rounded-2xl shadow-xl p-4 text-center border border-[#E0D5C8]/50">
                              <div className="mb-3">
                                {typeof selectedMember.spouse === 'object' ? (
                                  <PersonCircle name={selectedMember.spouse.name} photo={selectedMember.spouse.photoURL} size="xxl" />
                                ) : (
                                  <PersonCircle name={selectedMember.spouse} photo={null} size="xxl" />
                                )}
                              </div>
                              {typeof selectedMember.spouse === 'object' ? (
                                <>
                                  <h3 className="text-base font-serif font-bold text-[#5D4037]">{selectedMember.spouse.name}</h3>
                                  {selectedMember.spouse.nickname && (
                                    <p className="text-xs text-[#C4704B] font-medium italic">"{selectedMember.spouse.nickname}"</p>
                                  )}
                                  <AgeBadge birthDate={selectedMember.spouse.birthDate} deathDate={selectedMember.spouse.deathDate} />
                                  {selectedMember.spouse.bio && (
                                    <p className="text-[11px] text-[#5D4037]/60 italic mt-1 leading-relaxed">{selectedMember.spouse.bio}</p>
                                  )}
                                </>
                              ) : (
                                <h3 className="text-base font-serif font-bold text-[#5D4037]">{selectedMember.spouse}</h3>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Tab bar */}
                      <div className="sticky top-0 z-20 -mx-6 sm:-mx-8 px-4 sm:px-6 py-2 bg-[#FAF6EE] border-y border-[#E0D5C8] mb-6 shadow-sm">
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
                                  ? 'bg-[#C4704B] text-white shadow-md'
                                  : 'bg-white text-[#5D4037]/60 hover:text-[#5D4037] hover:bg-white/80 border border-[#E0D5C8]/50'
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
                          {/* Quick stats pills */}
                          <div className="flex flex-wrap justify-center gap-2 mb-8">
                            {selectedMember.children?.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7A9E7E]/10 text-[#7A9E7E] text-xs font-semibold">
                                <Users className="w-3.5 h-3.5" /> {selectedMember.children.length} hijos
                              </span>
                            )}
                            {totalGrandchildren > 0 && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8956D]/10 text-[#E8956D] text-xs font-semibold">
                                <Users className="w-3.5 h-3.5" /> {totalGrandchildren} nietos
                              </span>
                            )}
                            {selectedMember.location && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C4704B]/10 text-[#C4704B] text-xs font-semibold">
                                <MapPin className="w-3.5 h-3.5" /> {selectedMember.location}
                              </span>
                            )}
                          </div>
                        </>
                      )}

                      {/* TAB: Datos */}
                      {modalTab === 'datos' && (
                        <>
                          {(selectedMember.weddingDate || selectedMember.location) && (
                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6 py-3 px-4 rounded-xl bg-white/60 border border-[#E0D5C8]/50">
                              {selectedMember.weddingDate && (
                                <div className="flex items-center gap-1.5 text-sm text-[#5D4037]">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span className="font-medium">{formatDate(selectedMember.weddingDate)}</span>
                                </div>
                              )}
                              {selectedMember.weddingPlace && (
                                <div className="flex items-center gap-1.5 text-sm text-[#5D4037]">
                                  <Home className="w-3.5 h-3.5" />
                                  <span className="font-medium">{selectedMember.weddingPlace}</span>
                                </div>
                              )}
                              {selectedMember.location && (
                                <div className="flex items-center gap-1.5 text-sm text-[#7A9E7E]">
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
                                  <div className="flex items-center gap-1.5 text-sm font-bold text-[#C4704B]">
                                    <Heart className="w-3.5 h-3.5" />
                                    <span>{y} años de casados</span>
                                  </div>
                                ) : null
                              })()}
                            </div>
                          )}

                          {selectedMember.bio && (
                            <p className="text-sm text-[#5D4037]/70 leading-relaxed mb-4 italic text-center">{selectedMember.bio}</p>
                          )}

                          {!selectedMember.weddingDate && !selectedMember.location && !selectedMember.bio && (
                            <p className="text-sm text-[#5D4037]/40 text-center py-8">No hay datos adicionales registrados.</p>
                          )}
                        </>
                      )}

                      {/* TAB: Familia - Children */}
                      {modalTab === 'familia' && (
                        <>
                      {/* Children - each one with their complete family */}
                      {selectedMember.children && selectedMember.children.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-sm font-serif font-semibold text-[#5D4037] uppercase tracking-wider flex items-center gap-2 mb-4">
                            <Users className="w-4 h-4 text-[#B8943E]" />
                            Hijos ({selectedMember.children.length})
                          </h4>
                          <div className="space-y-8">
                            {selectedMember.children.map((child, i) => {
                              const hijoColors = ['#7A9E7E', '#C4704B', '#B8943E', '#5D4037', '#E8956D', '#2C3E50', '#8D6E63', '#D4B96A']
                              const hijoColor = hijoColors[i % hijoColors.length]
                              return (
                              <div key={i} className="bg-white rounded-2xl shadow-lg border-2 overflow-hidden group/child relative" style={{ borderColor: hijoColor }}>
                                {/* Move button */}
                                <button
                                  onClick={() => setMovingPerson({ person: child, parentId: selectedMember.id, childIndex: i })}
                                  className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center bg-white/80 hover:bg-[#7A9E7E]/10 shadow text-[#7A9E7E] transition opacity-0 group-hover/child:opacity-100 z-10"
                                  title="Mover a otro familiar"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                </button>

                                {/* Colored header bar with name */}
                                <div className="px-5 py-3" style={{ background: `linear-gradient(135deg, ${hijoColor}, ${hijoColor}CC)` }}>
                                  <p className="text-xs font-bold uppercase tracking-widest text-white/80">{child.role || (child.gender === 'F' ? 'Hija' : child.gender === 'M' ? 'Hijo' : 'Hijo(a)')}</p>
                                  <p className="text-lg font-serif font-bold text-white">{child.name.split(' ')[0]} {child.spouse && typeof child.spouse === 'object' ? `& ${child.spouse.name.split(' ')[0]}` : ''}</p>
                                </div>

                                {/* Couple: hijo + esposo/a side by side */}
                                <div className="p-5 flex items-center gap-4">
                                  {/* Hijo */}
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <PersonCircle name={child.name} photo={child.photoURL} size="md" />
                                    <div className="min-w-0">
                                      <p className="text-base font-bold text-[#5D4037] truncate">{child.name}</p>
                                      {child.nickname && <p className="text-xs text-[#C4704B] italic">"{child.nickname}"</p>}
                                      <AgeBadge birthDate={child.birthDate} deathDate={child.deathDate} />
                                      {child.location && <p className="text-xs text-[#7A9E7E] mt-0.5 flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {child.location}</p>}
                                    </div>
                                  </div>

                                  {/* Heart + Esposo/a */}
                                  {child.spouse && (
                                    <>
                                      <Heart className="w-4 h-4 text-[#C4704B] fill-[#C4704B] flex-shrink-0" />
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {typeof child.spouse === 'object' ? (
                                          <>
                                            <PersonCircle name={child.spouse.name} photo={child.spouse.photoURL} size="md" />
                                            <div className="min-w-0">
                                              <p className="text-base font-bold text-[#5D4037] truncate">{child.spouse.name}</p>
                                              {child.spouse.nickname && <p className="text-xs text-[#C4704B] italic">"{child.spouse.nickname}"</p>}
                                              <AgeBadge birthDate={child.spouse.birthDate} deathDate={child.spouse.deathDate} />
                                              {child.spouse.location && <p className="text-xs text-[#7A9E7E] mt-0.5 flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {child.spouse.location}</p>}
                                            </div>
                                          </>
                                        ) : (
                                          <p className="text-sm text-[#5D4037]/70">{child.spouse}</p>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>


                                {/* Wedding info for hijo */}
                                {(child.weddingDate || child.weddingPlace) && (
                                  <div className="px-5 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#E0D5C8]/40">
                                    {child.weddingDate && (
                                      <span className="text-xs text-[#5D4037]/70 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(child.weddingDate)}</span>
                                    )}
                                    {child.weddingPlace && (
                                      <span className="text-xs text-[#5D4037]/70 flex items-center gap-1"><Home className="w-3.5 h-3.5" /> {child.weddingPlace}</span>
                                    )}
                                    {child.weddingDate && (() => {
                                      const wd = new Date(child.weddingDate)
                                      const now = new Date()
                                      let y = now.getFullYear() - wd.getFullYear()
                                      if (now.getMonth() < wd.getMonth() || (now.getMonth() === wd.getMonth() && now.getDate() < wd.getDate())) y--
                                      return y > 0 ? <span className="text-xs font-bold text-[#C4704B] flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {y} años casados</span> : null
                                    })()}
                                  </div>
                                )}

                                {/* Bios */}
                                {(child.bio || (child.spouse && typeof child.spouse === 'object' && child.spouse.bio)) && (
                                  <div className="px-5 py-2 border-t border-[#E0D5C8]/40 space-y-1.5">
                                    {child.bio && (
                                      <p className="text-xs text-[#5D4037]/60 italic leading-relaxed">
                                        <span className="font-semibold not-italic text-[#7A9E7E]">{child.name?.split(' ')[0]}:</span> {child.bio}
                                      </p>
                                    )}
                                    {child.spouse && typeof child.spouse === 'object' && child.spouse.bio && (
                                      <p className="text-xs text-[#5D4037]/60 italic leading-relaxed">
                                        <span className="font-semibold not-italic text-[#C4704B]">{child.spouse.name?.split(' ')[0]}:</span> {child.spouse.bio}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Children of this hijo (nietos) */}
                                {child.children && child.children.length > 0 && (
                                  <div className="px-4 pb-4 pt-2 border-t border-[#E0D5C8]/40">
                                    <p className="text-[11px] font-semibold text-[#B8943E] uppercase tracking-wider mb-2 flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      Hijos de {child.name.split(' ')[0]} ({child.children.length})
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {child.children.map((ggc, gi) => {
                                        const cardColors = ['#7A9E7E', '#C4704B', '#B8943E', '#5D4037', '#E8956D']
                                        const cardColor = cardColors[gi % cardColors.length]
                                        return (
                                        <div key={gi} className="rounded-2xl bg-white border-2 shadow-md overflow-hidden relative group/ggc" style={{ borderColor: cardColor }}>
                                          {/* Move button */}
                                          <button
                                            onClick={() => setMovingPerson({ person: ggc, parentId: selectedMember.id, childIndex: i, grandchildIndex: gi })}
                                            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-white/80 hover:bg-[#7A9E7E]/10 shadow text-[#7A9E7E] transition opacity-0 group-hover/ggc:opacity-100 z-10"
                                            title="Mover"
                                          >
                                            <ArrowRightLeft className="w-3.5 h-3.5" />
                                          </button>

                                          {/* Colored header bar */}
                                          <div className="px-4 py-2.5" style={{ background: `linear-gradient(135deg, ${cardColor}, ${cardColor}CC)` }}>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-white">
                                              {ggc.gender === 'F' ? 'Nieta' : ggc.gender === 'M' ? 'Nieto' : 'Nieto(a)'}
                                            </p>
                                          </div>

                                          {/* Couple: nieto + esposo/a side by side */}
                                          <div className="p-4">
                                            <div className="flex items-center gap-3">
                                              <PersonCircle name={ggc.name} photo={ggc.photoURL} size="md" />
                                              <div className="flex-1 min-w-0">
                                                <p className="text-base font-serif font-bold text-[#5D4037] truncate">{ggc.name}</p>
                                                {ggc.nickname && <p className="text-xs text-[#C4704B] italic">"{ggc.nickname}"</p>}
                                                <AgeBadge birthDate={ggc.birthDate} deathDate={ggc.deathDate} />
                                                {ggc.location && (
                                                  <p className="text-[11px] text-[#7A9E7E] mt-0.5 flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {ggc.location}</p>
                                                )}
                                              </div>
                                            </div>

                                            {/* Spouse as partner */}
                                            {ggc.spouse && (
                                              <div className="mt-3 pt-3 border-t border-[#E0D5C8]/40">
                                                <div className="flex items-center gap-3">
                                                  <Heart className="w-4 h-4 flex-shrink-0" style={{ color: cardColor, fill: cardColor }} />
                                                  {typeof ggc.spouse === 'object' ? (
                                                    <>
                                                      <PersonCircle name={ggc.spouse.name} photo={ggc.spouse.photoURL} size="md" />
                                                      <div className="flex-1 min-w-0">
                                                        <p className="text-base font-serif font-bold text-[#5D4037] truncate">{ggc.spouse.name}</p>
                                                        {ggc.spouse.nickname && <p className="text-xs text-[#C4704B] italic">"{ggc.spouse.nickname}"</p>}
                                                        <AgeBadge birthDate={ggc.spouse.birthDate} deathDate={ggc.spouse.deathDate} />
                                                      </div>
                                                    </>
                                                  ) : (
                                                    <p className="text-sm text-[#5D4037]/70">{ggc.spouse}</p>
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                            {/* Bio */}
                                            {/* Wedding info */}
                                            {(ggc.weddingDate || ggc.weddingPlace) && (
                                              <div className="mt-3 pt-2 border-t border-[#E0D5C8]/40 flex flex-wrap items-center gap-x-4 gap-y-1">
                                                {ggc.weddingDate && (
                                                  <span className="text-xs text-[#5D4037]/70 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(ggc.weddingDate)}</span>
                                                )}
                                                {ggc.weddingPlace && (
                                                  <span className="text-xs text-[#5D4037]/70 flex items-center gap-1"><Home className="w-3.5 h-3.5" /> {ggc.weddingPlace}</span>
                                                )}
                                                {ggc.weddingDate && (() => {
                                                  const wd = new Date(ggc.weddingDate)
                                                  const now = new Date()
                                                  let y = now.getFullYear() - wd.getFullYear()
                                                  if (now.getMonth() < wd.getMonth() || (now.getMonth() === wd.getMonth() && now.getDate() < wd.getDate())) y--
                                                  return y > 0 ? <span className="text-xs font-bold text-[#C4704B] flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {y} años casados</span> : null
                                                })()}
                                              </div>
                                            )}

                                            {ggc.bio && <p className="text-xs text-[#5D4037]/60 italic mt-3 leading-relaxed">{ggc.bio}</p>}
                                          </div>

                                          {/* Bisnietos */}
                                          {ggc.children && ggc.children.length > 0 && (
                                            <div className="px-4 pb-4 pt-2 border-t border-[#E0D5C8]/30">
                                              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: cardColor }}>
                                                <Users className="w-3 h-3 inline mr-1" />
                                                Hijos de {ggc.name.split(' ')[0]} ({ggc.children.length})
                                              </p>
                                              <div className="space-y-2">
                                                {ggc.children.map((bn, bi) => (
                                                  <div key={bi} className="flex items-center gap-2 p-2.5 rounded-lg border" style={{ backgroundColor: `${cardColor}12`, borderColor: `${cardColor}25` }}>
                                                    <PersonCircle name={bn.name} photo={bn.photoURL} size="sm" />
                                                    <div className="flex-1 min-w-0">
                                                      <p className="text-sm font-bold text-[#5D4037] truncate">{bn.name}</p>
                                                      <AgeBadge birthDate={bn.birthDate} deathDate={bn.deathDate} />
                                                    </div>
                                                    {bn.spouse && (
                                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        <Heart className="w-2.5 h-2.5 text-[#C4704B]" />
                                                        <span className="text-xs text-[#5D4037]/60 truncate max-w-[80px]">{typeof bn.spouse === 'object' ? bn.spouse.name : bn.spouse}</span>
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
                          <h4 className="text-sm font-serif font-semibold text-[#5D4037] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Star className="w-4 h-4 text-[#B8943E]" />
                            Momentos Importantes
                          </h4>
                          <div className="space-y-3">
                            {selectedMember.moments.map((m, i) => (
                              <div key={i} className="flex gap-3 p-3 rounded-xl bg-white border border-[#E0D5C8]/50 shadow-sm relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: 'linear-gradient(to bottom, #C4704B, #B8943E)' }} />
                                <div className="w-10 h-10 rounded-full bg-[#B8943E]/10 flex items-center justify-center flex-shrink-0 ml-1">
                                  <Star className="w-5 h-5 text-[#B8943E]" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-[#5D4037]">{m.title}</p>
                                  {m.date && <p className="text-[11px] text-[#B8943E] font-medium">{formatDate(m.date)}</p>}
                                  {m.description && <p className="text-xs text-[#5D4037]/70 mt-0.5">{m.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {modalTab === 'momentos' && (!selectedMember.moments || selectedMember.moments.length === 0) && (
                        <p className="text-sm text-[#5D4037]/40 text-center py-8">No hay momentos registrados.</p>
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
                          (children || []).forEach(child => {
                            addPhotos(child, child.name?.split(' ')[0])
                            if (child.spouse && typeof child.spouse === 'object') addPhotos(child.spouse, child.spouse.name?.split(' ')[0])
                            if (child.children) walkPhotos(child.children)
                          })
                        }
                        walkPhotos(selectedMember.children)

                        if (allPhotos.length === 0) return (
                          <p className="text-sm text-[#5D4037]/40 text-center py-8">No hay fotos en la galeria.</p>
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
                                <h4 className="text-xs font-bold text-[#7A9E7E] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                  <Camera className="w-3.5 h-3.5" />
                                  Fotos de {owner} ({photos.length})
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {photos.map((g, i) => (
                                    <div key={i} className="rounded-xl overflow-hidden border border-[#E0D5C8]/50 shadow-sm bg-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all" onClick={() => g.photoURL && setLightboxPhoto(g)}>
                                      {g.photoURL ? (
                                        <img src={g.photoURL} alt={g.caption} className="w-full h-40 object-cover" />
                                      ) : (
                                        <div className="w-full h-40 bg-gradient-to-br from-[#7A9E7E]/20 to-[#B8943E]/20 flex items-center justify-center">
                                          <Camera className="w-8 h-8 text-[#7A9E7E]/40" />
                                        </div>
                                      )}
                                      {g.caption && <p className="text-[11px] text-[#5D4037]/70 p-2 text-center">{g.caption}</p>}
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
                          <h4 className="text-sm font-serif font-semibold text-[#5D4037] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-[#C4704B]" />
                            Voces de la Familia
                          </h4>
                          <div className="space-y-3">
                            {selectedMember.messages.map((msg, i) => (
                              <div key={i} className="p-4 rounded-xl bg-white border border-[#E0D5C8]/50 shadow-sm relative">
                                <span className="absolute top-2 left-3 text-4xl font-serif text-[#C4704B]/15 leading-none select-none">"</span>
                                <div className="flex items-center gap-2 mb-2 relative">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C4704B] to-[#B8943E] flex items-center justify-center shadow-sm">
                                    <span className="text-white text-[11px] font-bold">{(msg.author || '?')[0].toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-[#5D4037]">{msg.author}</p>
                                    {msg.date && <p className="text-[11px] text-[#5D4037]/40">{formatDate(msg.date)}</p>}
                                  </div>
                                </div>
                                <p className="text-sm text-[#5D4037]/80 italic ml-10 relative">"{msg.message}"</p>
                                <span className="absolute bottom-1 right-4 text-4xl font-serif text-[#C4704B]/15 leading-none select-none rotate-180">"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {modalTab === 'mensajes' && (!selectedMember.messages || selectedMember.messages.length === 0) && (
                        <p className="text-sm text-[#5D4037]/40 text-center py-8">No hay mensajes registrados.</p>
                      )}

                      {/* Actions footer - sticky frosted glass */}
                      <div className="sticky bottom-0 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 px-6 sm:px-8 py-4 bg-[#FFF8F0]/90 backdrop-blur-md border-t border-[#E0D5C8]">
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setSelectedMember(null); setEditingMember(selectedMember); }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#B8943E] text-white hover:bg-[#B8943E]/90 transition text-sm font-medium shadow-md"
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
                <div className="bg-white p-4">
                  {lightboxPhoto.caption && <p className="text-base font-serif font-bold text-[#5D4037]">{lightboxPhoto.caption}</p>}
                  {lightboxPhoto.owner && <p className="text-xs text-[#7A9E7E] mt-1">Subida por {lightboxPhoto.owner}</p>}
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
