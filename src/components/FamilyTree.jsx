import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Users, User, Plus, Pencil, Trash2, Eye, AlertTriangle, ArrowRightLeft } from 'lucide-react'
import { grandparents as defaultGrandparents } from '../data/familyData'
import { getFamilyMembers, saveFamilyMember, deleteFamilyMember, getGrandparents } from '../firebase/familyService'
import FamilyMemberForm from './FamilyMemberForm'

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
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
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
  }
  const iconSizes = { xs: 'w-5 h-5', sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-14 h-14' }

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
      style={{ width: hasSpouse ? '400px' : '220px' }}
      whileHover={{ scale: 1.02 }}
      onClick={onView}
    >
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
        <span className="absolute -top-2 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7A9E7E]/10 text-[#7A9E7E] border border-[#7A9E7E]/20">
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
        const nietos = child.children.reduce((s, c) => s + (c.children?.length || 0), 0)
        const bisnietos = child.children.reduce((s, c) =>
          s + (c.children || []).reduce((s2, gc) => s2 + (gc.children?.length || 0), 0), 0)
        return (
          <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-[#C4704B]/10 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-[#5D4037]/70">
              <Users className="w-3.5 h-3.5 text-[#B8943E]" />
              {hijos} hijos
            </span>
            {nietos > 0 && (
              <span className="text-xs text-[#7A9E7E] font-medium">{nietos} nietos</span>
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

  useEffect(() => {
    loadMembers()
    loadGrandparents()
  }, [])

  const loadGrandparents = async () => {
    const data = await getGrandparents()
    if (data) setGrandparentsData(data)
  }

  const loadMembers = async () => {
    const data = await getFamilyMembers()
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
                    onView={() => setSelectedMember(child)}
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
            {(() => {
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
            })().map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-[#C4704B]">{stat.value}</p>
                <p className="text-xs text-[#5D4037]/50 uppercase tracking-wider mt-1">{stat.label}</p>
                {stat.sub && <p className="text-[10px] text-[#7A9E7E] mt-0.5">{stat.sub}</p>}
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Selected member detail overlay */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedMember(null)} />
            <motion.div
              className="relative bg-[#FFF8F0] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6 sm:p-8">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-4 right-4 text-[#C4704B] hover:text-[#5D4037] transition"
                >
                  <span className="text-2xl">&times;</span>
                </button>

                {/* Family name title */}
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

                  // El apellido del hombre va primero
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
                  return (
                    <div className="text-center mb-6 pb-5 border-b border-[#C4704B]/10">
                      <p className="text-xs text-[#B8943E] font-semibold uppercase tracking-widest mb-1">Nucleo familiar</p>
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#5D4037]">{familyTitle}</h2>
                      <div className="flex items-center justify-center gap-3 mt-2">
                        <div className="h-px w-10 bg-[#C4704B]/30" />
                        <Heart className="w-4 h-4 text-[#C4704B] fill-[#C4704B]/30" />
                        <div className="h-px w-10 bg-[#C4704B]/30" />
                      </div>
                    </div>
                  )
                })()}

                {/* Couple display */}
                <div className="flex items-start justify-center gap-4 sm:gap-8 mb-6">
                  {/* Main person */}
                  <div className="flex flex-col items-center text-center flex-1">
                    <PersonCircle name={selectedMember.name} photo={selectedMember.photoURL} size="lg" />
                    <h3 className="text-base sm:text-lg font-serif font-bold text-[#5D4037] mt-2 leading-tight">
                      {selectedMember.name}
                    </h3>
                    {selectedMember.nickname && (
                      <p className="text-xs text-[#C4704B] font-medium italic">"{selectedMember.nickname}"</p>
                    )}
                    <AgeBadge birthDate={selectedMember.birthDate} deathDate={selectedMember.deathDate} />
                    {selectedMember.role && (
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7A9E7E]/10 text-[#7A9E7E]">
                        {selectedMember.role}
                      </span>
                    )}
                  </div>

                  {/* Heart */}
                  {selectedMember.spouse && (
                    <>
                      <div className="flex flex-col items-center pt-10 flex-shrink-0">
                        <Heart className="w-6 h-6 text-[#C4704B] fill-[#C4704B]" />
                      </div>

                      {/* Spouse */}
                      <div className="flex flex-col items-center text-center flex-1">
                        {typeof selectedMember.spouse === 'object' ? (
                          <>
                            <PersonCircle name={selectedMember.spouse.name} photo={selectedMember.spouse.photoURL} size="lg" />
                            <h3 className="text-base sm:text-lg font-serif font-bold text-[#5D4037] mt-2 leading-tight">
                              {selectedMember.spouse.name}
                            </h3>
                            {selectedMember.spouse.nickname && (
                              <p className="text-xs text-[#C4704B] font-medium italic">"{selectedMember.spouse.nickname}"</p>
                            )}
                            <AgeBadge birthDate={selectedMember.spouse.birthDate} deathDate={selectedMember.spouse.deathDate} />
                            {selectedMember.spouse.bio && (
                              <p className="text-[11px] text-[#5D4037]/60 italic mt-1 leading-relaxed">{selectedMember.spouse.bio}</p>
                            )}
                          </>
                        ) : (
                          <>
                            <PersonCircle name={selectedMember.spouse} photo={null} size="lg" />
                            <h3 className="text-base sm:text-lg font-serif font-bold text-[#5D4037] mt-2 leading-tight">
                              {selectedMember.spouse}
                            </h3>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {selectedMember.bio && (
                  <p className="text-sm text-[#5D4037]/70 leading-relaxed mb-6 italic text-center">{selectedMember.bio}</p>
                )}

                {/* Children (nietos) */}
                {selectedMember.children && selectedMember.children.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-[#5D4037] uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#B8943E]" />
                      Hijos ({selectedMember.children.length})
                    </h4>
                    {selectedMember.children.map((child, i) => (
                      <div key={i} className="rounded-xl bg-[#FAF6EE] border border-[#7A9E7E]/10 p-4 relative group/child">
                        {/* Move button */}
                        <button
                          onClick={() => setMovingPerson({ person: child, parentId: selectedMember.id, childIndex: i })}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-white/80 hover:bg-[#7A9E7E]/10 shadow text-[#7A9E7E] transition opacity-0 group-hover/child:opacity-100 z-10"
                          title="Mover a otro familiar"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                          <PersonCircle name={child.name} photo={child.photoURL} size="sm" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-[#5D4037] flex items-center gap-1.5">
                              {child.name}
                              <AgeBadge birthDate={child.birthDate} deathDate={child.deathDate} />
                            </p>
                            {child.nickname && <p className="text-xs text-[#5D4037]/60 italic">"{child.nickname}"</p>}
                          </div>
                          {child.spouse && (
                            typeof child.spouse === 'object' ? (
                              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#C4704B]/5">
                                <PersonCircle name={child.spouse.name} photo={child.spouse.photoURL} size="sm" />
                                <div>
                                  <p className="text-[10px] text-[#C4704B] font-medium">Esposo(a)</p>
                                  <p className="text-xs font-semibold text-[#5D4037] flex items-center gap-1">
                                    {child.spouse.name}
                                    <AgeBadge birthDate={child.spouse.birthDate} deathDate={child.spouse.deathDate} />
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-[#7A9E7E] flex items-center gap-1">
                                <Heart className="w-3 h-3 text-[#C4704B]" />
                                {child.spouse}
                              </p>
                            )
                          )}
                        </div>
                        {child.bio && <p className="text-xs text-[#5D4037]/60 italic mb-2 ml-12">{child.bio}</p>}

                        {/* Great-grandchildren (bisnietos) */}
                        {child.children && child.children.length > 0 && (
                          <div className="ml-6 pl-3 border-l-2 border-[#B8943E]/20 mt-3 space-y-2">
                            <p className="text-[10px] font-semibold text-[#B8943E] uppercase tracking-wider">
                              Hijos de {child.name.split(' ')[0]}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {child.children.map((ggc, gi) => (
                                <div key={gi} className="flex items-center gap-2 p-2 rounded-lg bg-[#FFFBF5] relative group/ggc">
                                  <button
                                    onClick={() => setMovingPerson({ person: ggc, parentId: selectedMember.id, childIndex: i, grandchildIndex: gi })}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center bg-white/80 hover:bg-[#7A9E7E]/10 shadow text-[#7A9E7E] transition opacity-0 group-hover/ggc:opacity-100 z-10"
                                    title="Mover a otro familiar"
                                  >
                                    <ArrowRightLeft className="w-3 h-3" />
                                  </button>
                                  <PersonCircle name={ggc.name} photo={ggc.photoURL} size="sm" />
                                  <div>
                                    <p className="text-xs font-semibold text-[#5D4037] flex items-center gap-1">
                                      {ggc.name}
                                      <AgeBadge birthDate={ggc.birthDate} deathDate={ggc.deathDate} />
                                    </p>
                                    {ggc.nickname && <p className="text-[9px] text-[#5D4037]/50 italic">"{ggc.nickname}"</p>}
                                    {ggc.spouse && (
                                      typeof ggc.spouse === 'object' ? (
                                        <p className="text-[10px] text-[#C4704B] flex items-center gap-0.5">
                                          <Heart className="w-2.5 h-2.5" /> {ggc.spouse.name}
                                        </p>
                                      ) : (
                                        <p className="text-[10px] text-[#7A9E7E]">
                                          <Heart className="w-2.5 h-2.5 inline text-[#C4704B]" /> {ggc.spouse}
                                        </p>
                                      )
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Datos de la Pareja */}
                {(selectedMember.weddingDate || selectedMember.location) && (
                  <div className="mt-6 p-4 rounded-xl bg-[#B8943E]/5 border border-[#B8943E]/10">
                    <h4 className="text-sm font-semibold text-[#5D4037] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-[#C4704B]" />
                      Datos de la Pareja
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedMember.weddingDate && (
                        <div>
                          <p className="text-[10px] text-[#5D4037]/50 uppercase">Fecha de matrimonio</p>
                          <p className="text-[#5D4037] font-medium">{selectedMember.weddingDate}</p>
                        </div>
                      )}
                      {selectedMember.weddingPlace && (
                        <div>
                          <p className="text-[10px] text-[#5D4037]/50 uppercase">Lugar de boda</p>
                          <p className="text-[#5D4037] font-medium">{selectedMember.weddingPlace}</p>
                        </div>
                      )}
                      {selectedMember.location && (
                        <div>
                          <p className="text-[10px] text-[#5D4037]/50 uppercase">Donde viven</p>
                          <p className="text-[#5D4037] font-medium">{selectedMember.location}</p>
                        </div>
                      )}
                      {selectedMember.weddingDate && (() => {
                        const wd = new Date(selectedMember.weddingDate)
                        const now = new Date()
                        let years = now.getFullYear() - wd.getFullYear()
                        if (now.getMonth() < wd.getMonth() || (now.getMonth() === wd.getMonth() && now.getDate() < wd.getDate())) years--
                        return years > 0 ? (
                          <div>
                            <p className="text-[10px] text-[#5D4037]/50 uppercase">Aniversario</p>
                            <p className="text-[#C4704B] font-bold">{years} años de casados</p>
                          </div>
                        ) : null
                      })()}
                    </div>
                  </div>
                )}

                {/* Momentos Importantes */}
                {selectedMember.moments && selectedMember.moments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-[#5D4037] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-4 h-4 text-[#B8943E]">★</span>
                      Momentos Importantes
                    </h4>
                    <div className="space-y-3">
                      {selectedMember.moments.map((m, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-[#FFFBF5] border border-[#B8943E]/10">
                          <div className="w-10 h-10 rounded-full bg-[#B8943E]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#B8943E] text-lg">★</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#5D4037]">{m.title}</p>
                            {m.date && <p className="text-[10px] text-[#B8943E] font-medium">{m.date}</p>}
                            {m.description && <p className="text-xs text-[#5D4037]/70 mt-0.5">{m.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Galeria Familiar */}
                {selectedMember.gallery && selectedMember.gallery.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-[#5D4037] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-4 h-4 text-[#7A9E7E]">📷</span>
                      Galeria Familiar
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedMember.gallery.map((g, i) => (
                        <div key={i} className="rounded-xl overflow-hidden border border-[#7A9E7E]/10">
                          {g.photoURL ? (
                            <img src={g.photoURL} alt={g.caption} className="w-full h-32 object-cover" />
                          ) : (
                            <div className="w-full h-32 bg-gradient-to-br from-[#7A9E7E]/20 to-[#B8943E]/20 flex items-center justify-center">
                              <span className="text-2xl">📷</span>
                            </div>
                          )}
                          {g.caption && <p className="text-[10px] text-[#5D4037]/70 p-2 text-center">{g.caption}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensajes y Recuerdos */}
                {selectedMember.messages && selectedMember.messages.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-[#5D4037] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-4 h-4 text-[#C4704B]">💬</span>
                      Voces de la Familia
                    </h4>
                    <div className="space-y-3">
                      {selectedMember.messages.map((msg, i) => (
                        <div key={i} className="p-3 rounded-xl bg-[#FAF6EE] border border-[#C4704B]/10">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C4704B] to-[#B8943E] flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold">{(msg.author || '?')[0].toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#5D4037]">{msg.author}</p>
                              {msg.date && <p className="text-[9px] text-[#5D4037]/40">{msg.date}</p>}
                            </div>
                          </div>
                          <p className="text-sm text-[#5D4037]/80 italic ml-9">"{msg.message}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-8 pt-4 border-t border-[#C4704B]/10">
                  <button
                    onClick={() => { setSelectedMember(null); setEditingMember(selectedMember); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#B8943E] text-white hover:bg-[#B8943E]/90 transition text-sm font-medium"
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
