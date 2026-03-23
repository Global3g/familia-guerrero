import { useState, useEffect } from 'react'
import Modal from './Modal'
import { uploadPhoto } from '../firebase/familyService'
import { Camera, Save, Loader2, Plus, Trash2, ChevronDown, ChevronRight, Heart, Users, User, MapPin, Calendar, Star, Image, MessageCircle } from 'lucide-react'
import ImageCropper from './ImageCropper'

const inputClass = 'w-full rounded-lg border border-[#7A9E7E]/20 bg-white px-3 py-2 text-sm text-[#5D4037] focus:outline-none focus:ring-2 focus:ring-[#7A9E7E]/30'
const labelClass = 'block text-xs font-medium text-[#5D4037] mb-1'

const emptySpouse = () => ({
  name: '', nickname: '', birthDate: '', deathDate: '', bio: '', photoURL: null, gender: '',
})

const emptyPerson = () => ({
  name: '', nickname: '', birthDate: '', deathDate: '',
  spouse: null, bio: '', children: [], gender: '',
})

// Colores por nivel de profundidad
const levelColors = [
  { border: '#7A9E7E', bg: '#7A9E7E', light: '#7A9E7E10', accent: '#7A9E7E' },
  { border: '#B8943E', bg: '#B8943E', light: '#B8943E10', accent: '#B8943E' },
  { border: '#C4704B', bg: '#C4704B', light: '#C4704B10', accent: '#C4704B' },
]

function SpouseBlock({ spouse, onChange, colors }) {
  const [expanded, setExpanded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState(null)

  const handleField = (field, value) => onChange({ ...spouse, [field]: value })

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setCropSrc(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropComplete = async (croppedFile) => {
    setCropSrc(null)
    setUploading(true)
    try {
      const url = await uploadPhoto(croppedFile, `spouses/${Date.now()}`)
      if (url) onChange({ ...spouse, photoURL: url })
    } catch (err) {
      console.error('Error uploading spouse photo:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-lg border p-2.5 space-y-2" style={{ borderColor: '#C4704B25', backgroundColor: '#C4704B08' }}>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-left flex-1">
          <label className="relative cursor-pointer flex-shrink-0 group" onClick={(e) => e.stopPropagation()}>
            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            {spouse.photoURL ? (
              <img src={spouse.photoURL} alt={spouse.name} className="w-8 h-8 rounded-full object-cover border group-hover:opacity-70 transition" style={{ borderColor: '#C4704B40' }} />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:opacity-70 transition" style={{ backgroundColor: '#C4704B15' }}>
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C4704B]" /> : <Camera className="w-3.5 h-3.5 text-[#C4704B]" />}
              </div>
            )}
          </label>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#C4704B] flex items-center gap-1">
              <Heart className="w-3 h-3" /> Esposo(a)
            </p>
            <p className="text-xs text-[#5D4037] truncate">{spouse.name || 'Sin nombre'}</p>
          </div>
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-[#5D4037]/40" /> : <ChevronRight className="w-3.5 h-3.5 text-[#5D4037]/40" />}
        </button>
        <button type="button" onClick={() => onChange(null)} className="p-1 rounded text-red-300 hover:text-red-600 transition ml-1">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 pt-1">
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              {spouse.photoURL ? (
                <div className="relative">
                  <img src={spouse.photoURL} alt={spouse.name} className="w-16 h-16 rounded-full object-cover border-2 group-hover:opacity-70 transition" style={{ borderColor: '#C4704B40' }} />
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#C4704B]/30 flex flex-col items-center justify-center text-[#C4704B] group-hover:opacity-70 transition">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Camera className="w-4 h-4 mb-0.5" /><span className="text-[8px]">Foto</span></>}
                </div>
              )}
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className={labelClass}>Nombre completo</label>
              <input type="text" value={spouse.name} onChange={(e) => handleField('name', e.target.value)} className={inputClass} placeholder="Nombre completo" />
            </div>
            <div>
              <label className={labelClass}>Apodo</label>
              <input type="text" value={spouse.nickname || ''} onChange={(e) => handleField('nickname', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Genero</label>
              <select value={spouse.gender || ''} onChange={(e) => handleField('gender', e.target.value)} className={inputClass}>
                <option value="">Seleccionar</option>
                <option value="M">Hombre</option>
                <option value="F">Mujer</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Nacimiento</label>
              <input type="date" value={spouse.birthDate || ''} onChange={(e) => handleField('birthDate', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fallecimiento</label>
              <input type="date" value={spouse.deathDate || ''} onChange={(e) => handleField('deathDate', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Biografia</label>
              <textarea value={spouse.bio || ''} onChange={(e) => handleField('bio', e.target.value)} rows={2} className={inputClass + ' resize-none'} />
            </div>
          </div>
        </div>
      )}
      <ImageCropper isOpen={!!cropSrc} imageSrc={cropSrc} onComplete={handleCropComplete} onCancel={() => setCropSrc(null)} />
    </div>
  )
}

function PersonBlock({ person, index, depth, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState(null)
  const colors = levelColors[Math.min(depth, levelColors.length - 1)]
  const childLabel = depth === 0 ? 'Hijos' : depth === 1 ? 'Nietos' : 'Bisnietos'
  const personChildren = person.children || []

  const handleFieldChange = (field, value) => {
    onChange(index, { ...person, [field]: value })
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setCropSrc(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropComplete = async (croppedFile) => {
    setCropSrc(null)
    setUploading(true)
    try {
      const url = await uploadPhoto(croppedFile, `members/${depth}-${Date.now()}`)
      if (url) onChange(index, { ...person, photoURL: url })
    } catch (err) {
      console.error('Error uploading photo:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleAddChild = () => {
    onChange(index, { ...person, children: [...personChildren, emptyPerson()] })
  }

  const handleRemoveChild = (ci) => {
    onChange(index, { ...person, children: personChildren.filter((_, i) => i !== ci) })
  }

  const handleChildChange = (ci, updatedChild) => {
    onChange(index, {
      ...person,
      children: personChildren.map((c, i) => i === ci ? updatedChild : c),
    })
  }

  const countDescendants = (p) => {
    const kids = p.children || []
    return kids.reduce((sum, c) => sum + 1 + countDescendants(c), 0)
  }

  const descendants = countDescendants(person)

  return (
    <div
      className="rounded-xl border p-3 space-y-3"
      style={{ borderColor: `${colors.border}25`, backgroundColor: `${colors.light}` }}
    >
      {/* Header with expand/collapse and delete */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left flex-1"
        >
          <label className="relative cursor-pointer flex-shrink-0 group" onClick={(e) => e.stopPropagation()}>
            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            {person.photoURL ? (
              <img src={person.photoURL} alt={person.name} className="w-9 h-9 rounded-full object-cover border-2 group-hover:opacity-70 transition" style={{ borderColor: `${colors.border}40` }} />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center group-hover:opacity-70 transition"
                style={{ backgroundColor: `${colors.bg}20` }}
              >
                {uploading
                  ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.accent }} />
                  : <Camera className="w-4 h-4" style={{ color: colors.accent }} />
                }
              </div>
            )}
          </label>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#5D4037] truncate">
              {person.name || 'Sin nombre'}
            </p>
            <p className="text-[10px] text-[#5D4037]/50">
              {person.spouse?.name ? `c/ ${person.spouse.name}` : typeof person.spouse === 'string' && person.spouse ? `c/ ${person.spouse}` : ''}
              {descendants > 0 ? ` · ${descendants} desc.` : ''}
            </p>
          </div>
          {expanded
            ? <ChevronDown className="w-4 h-4 text-[#5D4037]/40 flex-shrink-0" />
            : <ChevronRight className="w-4 h-4 text-[#5D4037]/40 flex-shrink-0" />
          }
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1.5 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition ml-2"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="space-y-3 pt-1">
          {/* Photo upload area */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              {person.photoURL ? (
                <div className="relative">
                  <img src={person.photoURL} alt={person.name} className="w-20 h-20 rounded-full object-cover border-2 group-hover:opacity-70 transition" style={{ borderColor: `${colors.border}40` }} />
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center group-hover:opacity-70 transition" style={{ borderColor: `${colors.border}40`, color: colors.accent }}>
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Camera className="w-5 h-5 mb-0.5" /><span className="text-[9px]">Subir foto</span></>}
                </div>
              )}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className={labelClass}>Nombre completo</label>
              <input
                type="text"
                value={person.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className={inputClass}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className={labelClass}>Apodo</label>
              <input
                type="text"
                value={person.nickname || ''}
                onChange={(e) => handleFieldChange('nickname', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Genero</label>
              <select value={person.gender || ''} onChange={(e) => handleFieldChange('gender', e.target.value)} className={inputClass}>
                <option value="">Seleccionar</option>
                <option value="M">Hombre</option>
                <option value="F">Mujer</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Nacimiento</label>
              <input
                type="date"
                value={person.birthDate || ''}
                onChange={(e) => handleFieldChange('birthDate', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Fallecimiento</label>
              <input
                type="date"
                value={person.deathDate || ''}
                onChange={(e) => handleFieldChange('deathDate', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Biografia</label>
              <textarea
                value={person.bio || ''}
                onChange={(e) => handleFieldChange('bio', e.target.value)}
                rows={2}
                className={inputClass + ' resize-none'}
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>
                <MapPin className="w-3 h-3 inline mr-1 text-[#C4704B]" />
                Donde vive
              </label>
              <input
                type="text"
                value={person.location || ''}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                className={inputClass}
                placeholder="Ciudad, Estado, Pais"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Calendar className="w-3 h-3 inline mr-1 text-[#B8943E]" />
                Fecha de boda
              </label>
              <input
                type="date"
                value={person.weddingDate || ''}
                onChange={(e) => handleFieldChange('weddingDate', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Lugar de boda</label>
              <input
                type="text"
                value={person.weddingPlace || ''}
                onChange={(e) => handleFieldChange('weddingPlace', e.target.value)}
                className={inputClass}
                placeholder="Iglesia, Ciudad"
              />
            </div>
          </div>

          {/* Spouse section */}
          {person.spouse && typeof person.spouse === 'object' ? (
            <SpouseBlock
              spouse={person.spouse}
              onChange={(updatedSpouse) => handleFieldChange('spouse', updatedSpouse)}
              colors={colors}
            />
          ) : (
            <button
              type="button"
              onClick={() => handleFieldChange('spouse', emptySpouse())}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border-dashed border border-[#C4704B]/30 py-2 text-xs text-[#C4704B] hover:bg-[#C4704B]/5 transition"
            >
              <Heart className="h-3.5 w-3.5" />
              Agregar esposo(a)
            </button>
          )}

          {/* Nested children */}
          {depth < 2 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold flex items-center gap-1" style={{ color: colors.accent }}>
                  <Users className="w-3.5 h-3.5" />
                  {childLabel} de {person.name?.split(' ')[0] || 'este familiar'}
                </p>
                {personChildren.length > 0 && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ color: colors.accent, backgroundColor: `${colors.bg}15` }}
                  >
                    {personChildren.length}
                  </span>
                )}
              </div>

              {personChildren.map((child, ci) => (
                <PersonBlock
                  key={ci}
                  person={child}
                  index={ci}
                  depth={depth + 1}
                  onChange={handleChildChange}
                  onRemove={handleRemoveChild}
                />
              ))}

              <button
                type="button"
                onClick={handleAddChild}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border-dashed border py-2 text-xs transition"
                style={{
                  borderColor: `${colors.border}40`,
                  color: colors.accent,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.bg}08`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar {depth === 0 ? 'hijo' : depth === 1 ? 'nieto' : 'bisnieto'}
              </button>
            </div>
          )}
        </div>
      )}
      <ImageCropper isOpen={!!cropSrc} imageSrc={cropSrc} onComplete={handleCropComplete} onCancel={() => setCropSrc(null)} />
    </div>
  )
}

function FamilyMemberForm({ isOpen, onClose, memberData, onSave }) {
  const getInitialForm = () => ({
    name: memberData?.name || '',
    nickname: memberData?.nickname || '',
    gender: memberData?.gender || '',
    birthDate: memberData?.birthDate || '',
    deathDate: memberData?.deathDate || '',
    role: memberData?.role || '',
    spouse: memberData?.spouse && typeof memberData.spouse === 'object' ? memberData.spouse : typeof memberData?.spouse === 'string' && memberData.spouse ? { ...emptySpouse(), name: memberData.spouse } : null,
    bio: memberData?.bio || '',
    weddingDate: memberData?.weddingDate || '',
    weddingPlace: memberData?.weddingPlace || '',
    location: memberData?.location || '',
    moments: memberData?.moments || [],
    gallery: memberData?.gallery || [],
    messages: memberData?.messages || [],
    children: memberData?.children || [],
  })

  const [form, setForm] = useState(getInitialForm)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(memberData?.photoURL || null)
  const [loading, setLoading] = useState(false)
  const [mainCropSrc, setMainCropSrc] = useState(null)

  useEffect(() => {
    setForm(getInitialForm())
    setPhoto(null)
    setPhotoPreview(memberData?.photoURL || null)
  }, [memberData, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setMainCropSrc(reader.result)
      reader.readAsDataURL(file)
      e.target.value = ''
      return
    }
  }

  const handleMainCropComplete = (croppedFile) => {
    setMainCropSrc(null)
    console.log('Crop complete, file:', croppedFile?.name, croppedFile?.size)
    if (croppedFile) {
      setPhoto(croppedFile)
      setPhotoPreview(URL.createObjectURL(croppedFile))
    }
  }

  const handleAddChild = () => {
    setForm((prev) => ({
      ...prev,
      children: [...prev.children, emptyPerson()],
    }))
  }

  const handleRemoveChild = (index) => {
    setForm((prev) => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index),
    }))
  }

  const handleChildChange = (index, updatedChild) => {
    setForm((prev) => ({
      ...prev,
      children: prev.children.map((c, i) => i === index ? updatedChild : c),
    }))
  }

  // Moments handlers
  const handleAddMoment = () => {
    setForm((prev) => ({
      ...prev,
      moments: [...prev.moments, { title: '', date: '', description: '' }],
    }))
  }
  const handleRemoveMoment = (index) => {
    setForm((prev) => ({
      ...prev,
      moments: prev.moments.filter((_, i) => i !== index),
    }))
  }
  const handleMomentChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      moments: prev.moments.map((m, i) => i === index ? { ...m, [field]: value } : m),
    }))
  }

  // Gallery handlers
  const handleAddGalleryItem = () => {
    setForm((prev) => ({
      ...prev,
      gallery: [...prev.gallery, { caption: '', photoURL: '' }],
    }))
  }
  const handleRemoveGalleryItem = (index) => {
    setForm((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }))
  }
  const handleGalleryChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      gallery: prev.gallery.map((g, i) => i === index ? { ...g, [field]: value } : g),
    }))
  }
  const handleGalleryPhoto = async (index, e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const url = await uploadPhoto(file, `gallery/${Date.now()}`)
      if (url) handleGalleryChange(index, 'photoURL', url)
    } catch (err) {
      console.error('Error uploading gallery photo:', err)
    }
  }

  // Messages handlers
  const handleAddMessage = () => {
    setForm((prev) => ({
      ...prev,
      messages: [...prev.messages, { author: '', message: '', date: '' }],
    }))
  }
  const handleRemoveMessage = (index) => {
    setForm((prev) => ({
      ...prev,
      messages: prev.messages.filter((_, i) => i !== index),
    }))
  }
  const handleMessageChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      messages: prev.messages.map((m, i) => i === index ? { ...m, [field]: value } : m),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('=== SUBMIT ===', 'photo:', photo, 'photoPreview:', photoPreview ? 'yes' : 'no')
    setLoading(true)
    try {
      let photoURL = memberData?.photoURL || null
      if (photo) {
        console.log('Uploading main photo...', photo.name, photo.size)
        const uploaded = await uploadPhoto(photo, `members/${Date.now()}-${photo.name}`)
        if (uploaded) {
          photoURL = uploaded
          console.log('Photo uploaded:', photoURL)
        } else {
          console.error('Photo upload returned null')
        }
      }
      await onSave({ ...form, photoURL })
      onClose()
    } catch (error) {
      console.error('Error saving member:', error)
      alert('Error al guardar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const countAll = (children) =>
    (children || []).reduce((sum, c) => sum + 1 + countAll(c.children), 0)

  const totalDescendants = countAll(form.children)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={memberData ? 'Editar Familiar' : 'Nuevo Familiar'}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Photo upload */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-24 w-24 rounded-full border-2 border-[#7A9E7E]/30 bg-[#FAF6EE] overflow-hidden flex items-center justify-center">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-7 w-7 text-[#7A9E7E]/50" />
            )}
          </div>
          <label className="cursor-pointer rounded-lg border border-[#7A9E7E]/30 px-3 py-1 text-xs text-[#7A9E7E] hover:bg-[#7A9E7E]/10 transition">
            <Camera className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />
            Subir foto
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>

        {/* Basic info - parent level */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelClass}>Nombre completo</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Apodo</label>
            <input type="text" name="nickname" value={form.nickname} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Genero</label>
            <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
              <option value="">Seleccionar</option>
              <option value="M">Hombre</option>
              <option value="F">Mujer</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Rol</label>
            <input type="text" name="role" value={form.role} onChange={handleChange} className={inputClass} placeholder='Ej. "Hijo mayor"' />
          </div>
          <div>
            <label className={labelClass}>Nacimiento</label>
            <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Fallecimiento</label>
            <input type="date" name="deathDate" value={form.deathDate} onChange={handleChange} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Biografia</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={2} className={inputClass + ' resize-none'} />
          </div>
        </div>

        {/* Spouse section - parent level */}
        {form.spouse && typeof form.spouse === 'object' ? (
          <SpouseBlock
            spouse={form.spouse}
            onChange={(updatedSpouse) => setForm((prev) => ({ ...prev, spouse: updatedSpouse }))}
            colors={levelColors[0]}
          />
        ) : (
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, spouse: emptySpouse() }))}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-dashed border-2 border-[#C4704B]/30 py-2.5 text-sm text-[#C4704B] hover:bg-[#C4704B]/5 transition"
          >
            <Heart className="h-4 w-4" />
            Agregar esposo(a)
          </button>
        )}

        {/* SECTION 1: Datos de la pareja */}
        <div className="rounded-xl border border-[#B8943E]/20 bg-[#FAF6EE] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#5D4037] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#B8943E]" />
            Datos de la pareja
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fecha de boda</label>
              <input type="date" name="weddingDate" value={form.weddingDate} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Lugar de boda</label>
              <input type="text" name="weddingPlace" value={form.weddingPlace} onChange={handleChange} className={inputClass} placeholder="Lugar de la boda" />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Donde viven</label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#5D4037]/40" />
                <input type="text" name="location" value={form.location} onChange={handleChange} className={inputClass + ' pl-8'} placeholder="Ciudad, Estado, Pais" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Momentos importantes */}
        <div className="rounded-xl border border-[#C4704B]/20 bg-[#C4704B08] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#5D4037] flex items-center gap-1.5">
            <Star className="w-4 h-4 text-[#C4704B]" />
            Momentos importantes
          </h3>
          {form.moments.map((moment, index) => (
            <div key={index} className="rounded-lg border border-[#C4704B]/15 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#C4704B]">Momento {index + 1}</span>
                <button type="button" onClick={() => handleRemoveMoment(index)} className="p-1 rounded text-red-300 hover:text-red-600 transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Titulo</label>
                  <input type="text" value={moment.title} onChange={(e) => handleMomentChange(index, 'title', e.target.value)} className={inputClass} placeholder="Titulo del momento" />
                </div>
                <div>
                  <label className={labelClass}>Fecha</label>
                  <input type="date" value={moment.date} onChange={(e) => handleMomentChange(index, 'date', e.target.value)} className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Descripcion</label>
                  <textarea value={moment.description} onChange={(e) => handleMomentChange(index, 'description', e.target.value)} rows={1} className={inputClass + ' resize-none'} placeholder="Describe este momento..." />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddMoment}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-dashed border-2 border-[#C4704B]/30 py-2.5 text-sm text-[#C4704B] hover:bg-[#C4704B]/5 transition"
          >
            <Star className="h-4 w-4" />
            Agregar momento
          </button>
        </div>

        {/* SECTION 3: Galeria familiar */}
        <div className="rounded-xl border border-[#7A9E7E]/20 bg-[#7A9E7E08] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#5D4037] flex items-center gap-1.5">
            <Image className="w-4 h-4 text-[#7A9E7E]" />
            Galeria familiar
          </h3>
          {form.gallery.map((item, index) => (
            <div key={index} className="rounded-lg border border-[#7A9E7E]/15 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#7A9E7E]">Foto {index + 1}</span>
                <button type="button" onClick={() => handleRemoveGalleryItem(index)} className="p-1 rounded text-red-300 hover:text-red-600 transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                {item.photoURL && (
                  <img src={item.photoURL} alt={item.caption || 'Foto'} className="w-14 h-14 rounded-lg object-cover border border-[#7A9E7E]/20" />
                )}
                <div className="flex-1 space-y-2">
                  <div>
                    <label className={labelClass}>Descripcion</label>
                    <input type="text" value={item.caption} onChange={(e) => handleGalleryChange(index, 'caption', e.target.value)} className={inputClass} placeholder="Descripcion de la foto" />
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-[#7A9E7E]/30 px-3 py-1 text-xs text-[#7A9E7E] hover:bg-[#7A9E7E]/10 transition">
                    <Camera className="h-3.5 w-3.5" />
                    Subir foto
                    <input type="file" accept="image/*" onChange={(e) => handleGalleryPhoto(index, e)} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddGalleryItem}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-dashed border-2 border-[#7A9E7E]/30 py-2.5 text-sm text-[#7A9E7E] hover:bg-[#7A9E7E]/5 transition"
          >
            <Image className="h-4 w-4" />
            Agregar foto
          </button>
        </div>

        {/* SECTION 4: Mensajes y recuerdos */}
        <div className="rounded-xl border border-[#B8943E]/20 bg-[#B8943E08] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#5D4037] flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-[#B8943E]" />
            Mensajes y recuerdos
          </h3>
          {form.messages.map((msg, index) => (
            <div key={index} className="rounded-lg border border-[#B8943E]/15 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#B8943E]">Mensaje {index + 1}</span>
                <button type="button" onClick={() => handleRemoveMessage(index)} className="p-1 rounded text-red-300 hover:text-red-600 transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Autor</label>
                  <input type="text" value={msg.author} onChange={(e) => handleMessageChange(index, 'author', e.target.value)} className={inputClass} placeholder="Quien escribe" />
                </div>
                <div>
                  <label className={labelClass}>Fecha</label>
                  <input type="date" value={msg.date} onChange={(e) => handleMessageChange(index, 'date', e.target.value)} className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Mensaje</label>
                  <textarea value={msg.message} onChange={(e) => handleMessageChange(index, 'message', e.target.value)} rows={1} className={inputClass + ' resize-none'} placeholder="Escribe un mensaje o recuerdo..." />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddMessage}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-dashed border-2 border-[#B8943E]/30 py-2.5 text-sm text-[#B8943E] hover:bg-[#B8943E]/5 transition"
          >
            <MessageCircle className="h-4 w-4" />
            Agregar mensaje
          </button>
        </div>

        {/* Children section - recursive */}
        <div className="rounded-xl border border-[#7A9E7E]/20 bg-[#FAF6EE] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#5D4037] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#7A9E7E]" />
              Hijos de {form.name?.split(' ')[0] || 'este familiar'}
            </h3>
            {totalDescendants > 0 && (
              <span className="text-[10px] font-medium text-[#7A9E7E] bg-[#7A9E7E]/10 px-2 py-0.5 rounded-full">
                {totalDescendants} descendientes
              </span>
            )}
          </div>

          {form.children.map((child, index) => (
            <PersonBlock
              key={index}
              person={child}
              index={index}
              depth={0}
              onChange={handleChildChange}
              onRemove={handleRemoveChild}
            />
          ))}

          <button
            type="button"
            onClick={handleAddChild}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-dashed border-2 border-[#7A9E7E]/30 py-2.5 text-sm text-[#7A9E7E] hover:bg-[#7A9E7E]/5 transition"
          >
            <Plus className="h-4 w-4" />
            Agregar hijo
          </button>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[#7A9E7E] px-6 py-2.5 text-white hover:bg-[#7A9E7E]/90 transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
      <ImageCropper isOpen={!!mainCropSrc} imageSrc={mainCropSrc} onComplete={handleMainCropComplete} onCancel={() => setMainCropSrc(null)} />
    </Modal>
  )
}

export default FamilyMemberForm
