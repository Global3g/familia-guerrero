import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, Sun, Camera, Plus, Pencil, Trash2, Save, Loader2, MessageCircle } from "lucide-react";
import { memorials as defaultMemorials } from "../data/familyData";
import { getMemorials, saveMemorial, deleteMemorial, uploadPhoto, getFamilyMembers, getGrandparents } from "../firebase/familyService";
import { SkeletonGrid } from './Skeleton';
import Modal from './Modal';
import sounds from '../utils/sounds';
import ImageCropper from './ImageCropper';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, duration: 0.8, ease: "easeOut" },
  }),
};

function LightRay({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="100"
        y1="0"
        x2="100"
        y2="200"
        stroke="currentColor"
        strokeOpacity="0.04"
        strokeWidth="1"
      />
      <line
        x1="60"
        y1="10"
        x2="80"
        y2="190"
        stroke="currentColor"
        strokeOpacity="0.03"
        strokeWidth="1"
      />
      <line
        x1="140"
        y1="10"
        x2="120"
        y2="190"
        stroke="currentColor"
        strokeOpacity="0.03"
        strokeWidth="1"
      />
      <line
        x1="20"
        y1="30"
        x2="60"
        y2="180"
        stroke="currentColor"
        strokeOpacity="0.02"
        strokeWidth="1"
      />
      <line
        x1="180"
        y1="30"
        x2="140"
        y2="180"
        stroke="currentColor"
        strokeOpacity="0.02"
        strokeWidth="1"
      />
    </svg>
  );
}

function formatYear(dateStr) {
  if (!dateStr) return "";
  return dateStr.split("-")[0];
}

function calcAge(birthDate, deathDate) {
  if (!birthDate || !deathDate) return null
  const birth = new Date(birthDate)
  const end = new Date(deathDate)
  let age = end.getFullYear() - birth.getFullYear()
  const m = end.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--
  return age
}

const inputClass = 'w-full rounded-lg border-4 border-white/80 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#B8976A]/30'
const labelClass = 'block text-xs font-medium text-white mb-1'

function MemorialForm({ isOpen, onClose, data, onSave }) {
  const [form, setForm] = useState({ name: '', birthDate: '', deathDate: '', relationship: '', tribute: '', legacy: '', gallery: [] })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [cropSrc, setCropSrc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)

  useEffect(() => {
    setForm({
      name: data?.name || '',
      birthDate: data?.birthDate || '',
      deathDate: data?.deathDate || '',
      relationship: data?.relationship || '',
      tribute: data?.tribute || '',
      legacy: data?.legacy || '',
      gallery: data?.gallery || [],
    })
    setPhotoFile(null)
    setPhotoPreview(data?.photoURL || null)
  }, [data, isOpen])

  const handleAddGalleryPhoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setUploadingGallery(true)
    try {
      const url = await uploadPhoto(file, `memorials/gallery/${Date.now()}`)
      if (url) {
        setForm(p => ({ ...p, gallery: [...p.gallery, { photoURL: url, caption: '' }] }))
      }
    } catch (err) {
      console.error('Error uploading gallery photo:', err)
    } finally {
      setUploadingGallery(false)
    }
  }

  const handleRemoveGalleryPhoto = (index) => {
    if (!confirm('¿Eliminar esta foto?')) return
    setForm(p => ({ ...p, gallery: p.gallery.filter((_, i) => i !== index) }))
  }

  const handleGalleryCaption = (index, caption) => {
    setForm(p => ({ ...p, gallery: p.gallery.map((g, i) => i === index ? { ...g, caption } : g) }))
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setCropSrc(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropComplete = (croppedFile) => {
    setCropSrc(null)
    setPhotoFile(croppedFile)
    setPhotoPreview(URL.createObjectURL(croppedFile))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let photoURL = data?.photoURL || null
      if (photoFile) {
        photoURL = await uploadPhoto(photoFile, `memorials/${Date.now()}`)
      }
      await onSave({ ...form, photoURL, gallery: form.gallery })
      onClose()
    } catch (err) {
      console.error('Error saving memorial:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={data ? 'Editar Homenaje' : 'Nuevo Homenaje'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo */}
        <div className="flex justify-center">
          <label className="cursor-pointer group">
            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md group-hover:opacity-80 transition" />
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 sm:opacity-0 sm:group-hover:opacity-100 transition">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-[#B8976A]/40 flex flex-col items-center justify-center text-[#B8976A] group-hover:border-[#B8976A] transition">
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-[11px]">Subir foto</span>
              </div>
            )}
          </label>
        </div>

        <div>
          <label className={labelClass}>Nombre completo</label>
          <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} required placeholder="Nombre completo" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Fecha de nacimiento</label>
            <input type="date" value={form.birthDate} onChange={(e) => setForm(p => ({ ...p, birthDate: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Fecha de fallecimiento</label>
            <input type="date" value={form.deathDate} onChange={(e) => setForm(p => ({ ...p, deathDate: e.target.value }))} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Parentesco</label>
          <input type="text" value={form.relationship} onChange={(e) => setForm(p => ({ ...p, relationship: e.target.value }))} className={inputClass} placeholder='Ej. "Abuelo paterno", "Tio"' />
        </div>
        <div>
          <label className={labelClass}>Tributo / Semblanza</label>
          <textarea value={form.tribute} onChange={(e) => setForm(p => ({ ...p, tribute: e.target.value }))} rows={3} className={inputClass + ' resize-none'} placeholder="Palabras en su memoria..." />
        </div>
        <div>
          <label className={labelClass}>Legado / Enseñanza</label>
          <input type="text" value={form.legacy} onChange={(e) => setForm(p => ({ ...p, legacy: e.target.value }))} className={inputClass} placeholder="Lo que nos dejo como legado" />
        </div>

        {/* Gallery */}
        <div className="rounded-xl border border-[#C8A87A]/20 bg-[#C8A87A08] p-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-[#B8976A]" />
            Fotografias ({form.gallery.length})
          </h3>

          {form.gallery.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {form.gallery.map((g, i) => (
                <div key={i} className="relative group/gp">
                  <img src={g.photoURL} alt={g.caption || 'Foto'} className="w-full h-24 rounded-lg object-cover border border-[#C8A87A]/20" />
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryPhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/gp:opacity-100 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <input
                    type="text"
                    value={g.caption}
                    onChange={(e) => handleGalleryCaption(i, e.target.value)}
                    className="w-full mt-1 text-[11px] px-2 py-1 rounded border border-[#C8A87A]/20 bg-white text-white focus:outline-none"
                    placeholder="Descripcion..."
                  />
                </div>
              ))}
            </div>
          )}

          <label className="flex w-full items-center justify-center gap-2 rounded-lg border-dashed border-2 border-[#B8976A]/30 py-2.5 text-sm text-[#B8976A] hover:bg-[#B8976A]/5 transition cursor-pointer">
            {uploadingGallery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {uploadingGallery ? 'Subiendo...' : 'Agregar fotografia'}
            <input type="file" accept="image/*" onChange={handleAddGalleryPhoto} className="hidden" disabled={uploadingGallery} />
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-[#B8976A] px-6 py-2.5 text-white hover:bg-[#B8976A]/90 transition disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
      <ImageCropper isOpen={!!cropSrc} imageSrc={cropSrc} onComplete={handleCropComplete} onCancel={() => setCropSrc(null)} />
    </Modal>
  )
}

export default function Memorial() {
  const [memorials, setMemorials] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingMemorial, setEditingMemorial] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deletingMemorial, setDeletingMemorial] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [audio] = useState(() => typeof Audio !== 'undefined' ? new Audio('https://cdn.pixabay.com/audio/2022/02/23/audio_ea70ad08e0.mp3') : null)

  useEffect(() => {
    if (!audio) return
    audio.loop = true
    audio.volume = 0.15
    return () => { audio.pause() }
  }, [audio])

  useEffect(() => {
    if (!audio) return
    playing ? audio.play().catch(() => {}) : audio.pause()
  }, [playing, audio])

  useEffect(() => {
    loadMemorials()
  }, [])

  const loadMemorials = async () => {
    setLoading(true)
    const [manualData, members, gp] = await Promise.all([getMemorials(), getFamilyMembers(), getGrandparents()])

    // Collect deceased from the family tree
    const fromTree = []
    const walk = (person, parentName) => {
      if (person.deathDate) {
        fromTree.push({
          name: person.name,
          photoURL: person.photoURL,
          birthDate: person.birthDate,
          deathDate: person.deathDate,
          relationship: person.role || (parentName ? `Familiar de ${parentName}` : ''),
          tribute: person.bio || '',
          legacy: '',
          _source: 'tree',
        })
      }
      if (person.spouse && typeof person.spouse === 'object' && person.spouse.deathDate) {
        fromTree.push({
          name: person.spouse.name,
          photoURL: person.spouse.photoURL,
          birthDate: person.spouse.birthDate,
          deathDate: person.spouse.deathDate,
          relationship: `Esposo(a) de ${person.name?.split(' ')[0] || ''}`,
          tribute: person.spouse.bio || '',
          legacy: '',
          _source: 'tree',
        })
      }
      if (person.children) person.children.forEach(c => walk(c, person.name?.split(' ')[0]))
    }
    if (gp) {
      const gf = gp.grandfather
      const gm = gp.grandmother
      if (gf?.deathDate) fromTree.push({ name: gf.fullName || gf.name, photoURL: gf.photoURL || gf.photo, birthDate: gf.birthDate, deathDate: gf.deathDate, relationship: gf.role || 'Abuelo', tribute: gf.bio || '', legacy: gf.values?.[0] || '', _source: 'tree' })
      if (gm?.deathDate) fromTree.push({ name: gm.fullName || gm.name, photoURL: gm.photoURL || gm.photo, birthDate: gm.birthDate, deathDate: gm.deathDate, relationship: gm.role || 'Abuela', tribute: gm.bio || '', legacy: gm.values?.[0] || '', _source: 'tree' })
    }
    members.forEach(m => walk(m, null))

    // Merge: manual memorials take priority, add tree ones that aren't already in manual
    const normalize = (n) => n?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    const manualNames = new Set(manualData.map(m => normalize(m.name)))
    const treeOnly = fromTree.filter(t => !manualNames.has(normalize(t.name)))

    const all = [...manualData, ...treeOnly]

    // Sort by deathDate (most recent first)
    all.sort((a, b) => {
      if (!a.deathDate && !b.deathDate) return 0
      if (!a.deathDate) return 1
      if (!b.deathDate) return -1
      return b.deathDate.localeCompare(a.deathDate)
    })

    setMemorials(all)
    setLoading(false)
  }

  const displayMemorials = memorials

  const handleSave = async (formData) => {
    const id = editingMemorial?.id || null
    await saveMemorial(id, formData)
    sounds.save()
    setEditingMemorial(null)
    setShowCreateForm(false)
    await loadMemorials()
  }

  const handleDelete = async () => {
    if (deletingMemorial?.id) {
      await deleteMemorial(deletingMemorial.id)
      sounds.delete()
      setDeletingMemorial(null)
      await loadMemorials()
    }
  }

  return (
    <section
      id="homenaje"
      className="relative py-24 overflow-hidden"
      style={{ backgroundColor: "#0F172A" }}
    >
      {/* Warm glow background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full opacity-[0.07] blur-[120px] pointer-events-none bg-[#B8976A]" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-[0.05] blur-[80px] pointer-events-none bg-[#C8A87A]" />

      {/* Light rays */}
      <LightRay className="absolute top-0 left-1/4 w-48 h-full text-[#B8976A] pointer-events-none" />
      <LightRay className="absolute top-0 right-1/4 w-48 h-full text-[#C8A87A] pointer-events-none" />

      {/* Subtle floating stars */}
      <Star className="absolute top-16 right-20 w-4 h-4 text-white/20 pointer-events-none" />
      <Star className="absolute top-32 left-16 w-3 h-3 text-white/20 pointer-events-none" />
      <Star className="absolute bottom-24 right-1/3 w-3 h-3 text-white/20 pointer-events-none" />

      {/* Floating particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#C8A87A] pointer-events-none"
          style={{ left: `${10 + i * 12}%`, top: `${20 + (i % 3) * 25}%` }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          custom={0}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-sans font-medium uppercase tracking-[5px] text-white/40 mb-4">En su memoria</p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-5">
            Siempre Con Nosotros
          </h2>
          <div className="w-8 h-[1px] bg-[#B8654A] mx-auto mb-5" />
          <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
            Su luz sigue brillando en cada uno de nosotros.
          </p>
          <button
            onClick={() => setPlaying(!playing)}
            className="mx-auto mt-2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/20 text-white/50 text-xs font-medium hover:bg-white/10 transition"
          >
            {playing ? '⏸ Pausar musica' : '🎵 Musica ambiental'}
          </button>
        </motion.div>

        {/* Skeleton while loading */}
        {loading && <SkeletonGrid count={4} />}

        {/* Memorial cards */}
        {!loading && <div className="grid gap-10 md:grid-cols-2">
          {displayMemorials.map((person, index) => (
            <motion.article
              key={person.id || index}
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={index * 0.3 + 0.2}
              className="relative bg-white/5 backdrop-blur-sm rounded-3xl border-4 border-white/80 shadow-lg shadow-black/10 p-8 text-center group hover:shadow-xl hover:shadow-black/20 transition-shadow duration-500"
            >
              {/* Edit/Delete buttons */}
              <div className="absolute top-3 right-3 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => setEditingMemorial(person)} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 shadow text-white/50 transition">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeletingMemorial(person)} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-red-500/20 shadow text-red-400 hover:text-red-400 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Decorative star */}
              <Star
                className="absolute top-4 left-4 w-5 h-5 text-white/20 group-hover:text-white/30 transition-colors"
              />

              {/* Photo */}
              <div className="mx-auto mb-6 w-[120px] h-[120px] rounded-full bg-gradient-to-br from-[#C8A87A]/20 via-[#B8976A]/15 to-[#9BBAA8]/10 border-4 border-white/80 shadow-md flex items-center justify-center">
                {(person.photo || person.photoURL) ? (
                  <img
                    src={person.photoURL || person.photo}
                    alt={person.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Camera className="w-10 h-10 text-white/25" />
                )}
              </div>

              {/* Name */}
              <h3 className="font-serif text-2xl font-bold text-white">
                {person.name}
              </h3>

              {/* Dates + age */}
              <p className="font-sans mt-1 text-sm text-[#B8976A] font-medium tracking-wide">
                {formatYear(person.birthDate)} &ndash;{" "}
                {formatYear(person.deathDate)}
                {(() => {
                  const age = calcAge(person.birthDate, person.deathDate)
                  return age ? <span className="ml-2 text-xs opacity-70">({age} años)</span> : null
                })()}
              </p>

              {/* Relationship */}
              <p className="font-sans mt-2 text-sm text-white/50 italic">
                {person.relationship}
              </p>

              {/* Divider */}
              <div className="mx-auto my-5 w-16 h-px bg-gradient-to-r from-transparent via-[#C8A87A]/40 to-transparent" />

              {/* Tribute / Bio */}
              {(person.tribute || person.bio) && (
                <p className="font-sans text-white/70 leading-relaxed">
                  {person.tribute || person.bio}
                </p>
              )}

              {/* Legacy */}
              {person.legacy && (
                <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#9BBAA8]/10 border border-[#9BBAA8]/15">
                  <Heart className="w-4 h-4 text-[#9BBAA8]" fill="#9BBAA8" />
                  <span className="font-sans text-sm text-white/70 italic">
                    {person.legacy}
                  </span>
                </div>
              )}

              {/* Gallery */}
              {person.gallery && person.gallery.length > 0 && (
                <div className="mt-6 pt-5 border-t border-white/80">
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    Recuerdos en imagenes
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {person.gallery.map((g, gi) => (
                      <div key={gi} className="rounded-lg overflow-hidden border-4 border-white/80 shadow-sm">
                        <img src={g.photoURL} alt={g.caption || 'Recuerdo'} className="w-full h-20 object-cover" />
                        {g.caption && (
                          <p className="text-[11px] text-white/50 p-1.5 text-center leading-tight">{g.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Virtual candle */}
              <div className="mt-4 pt-4 border-t border-white/80 text-center">
                <button
                  onClick={(e) => {
                    sounds.candle()
                    const btn = e.currentTarget
                    btn.innerHTML = '<span style="font-size:24px;filter:drop-shadow(0 0 8px #C8A87A);">🕯️</span><p style="font-size:11px;color:#B8976A;margin-top:4px;">Vela encendida</p>'
                    btn.disabled = true
                  }}
                  className="inline-flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-white/5 transition text-white/40 text-xs font-medium"
                >
                  <span style={{fontSize:'20px'}}>🕯️</span>
                  Encender una vela
                </button>
              </div>

              {/* Leave a memory */}
              <div className="mt-3 pt-3 border-t border-white/80">
                <details className="group">
                  <summary className="text-[11px] text-white/40 font-medium cursor-pointer flex items-center gap-1 justify-center">
                    <MessageCircle className="w-3 h-3" />
                    Dejar un recuerdo ({(person.memories || []).length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {(person.memories || []).map((mem, mi) => (
                      <p key={mi} className="text-[11px] text-white/70 italic bg-white/5 rounded-lg p-2">
                        "{mem.text}" — <span className="font-semibold not-italic">{mem.author}</span>
                      </p>
                    ))}
                    <div className="flex gap-2">
                      <input type="text" id={`mem-text-${person.id || index}`} placeholder="Tu recuerdo..." className="flex-1 text-[11px] px-2 py-1.5 rounded-lg border-4 border-white/80 bg-white/5 text-white focus:outline-none placeholder:text-white/30" />
                      <button
                        onClick={async () => {
                          const input = document.getElementById(`mem-text-${person.id || index}`)
                          if (!input?.value.trim()) return
                          const newMemory = { text: input.value.trim(), author: 'Anonimo', date: new Date().toISOString() }
                          if (person.id) {
                            const updatedMemories = [...(person.memories || []), newMemory]
                            await saveMemorial(person.id, { memories: updatedMemories })
                            await loadMemorials()
                          }
                          input.value = ''
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#B8976A] text-white text-[11px] font-medium hover:bg-[#B8976A]/90 transition"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            </motion.article>
          ))}
        </div>}

        {/* Add memorial button */}
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-[#B8976A]/40 text-[#B8976A] hover:bg-[#B8976A]/5 hover:border-[#B8976A] transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Agregar homenaje
          </button>
        </div>

        {/* Closing message */}
        <motion.p
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          custom={1}
          className="mt-14 text-center font-serif text-xl text-white/50 italic max-w-lg mx-auto"
        >
          &ldquo;No se van del todo quienes dejan huella en el
          coraz&oacute;n.&rdquo;
        </motion.p>
      </div>

      {/* Form modals */}
      <MemorialForm isOpen={editingMemorial !== null} onClose={() => setEditingMemorial(null)} data={editingMemorial} onSave={handleSave} />
      <MemorialForm isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} data={null} onSave={handleSave} />

      {/* Delete confirmation */}
      <AnimatePresence>
        {deletingMemorial && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingMemorial(null)} />
            <motion.div className="relative bg-[#1E293B] rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3 className="text-lg font-serif font-bold text-white mb-2">Eliminar homenaje</h3>
              <p className="text-sm text-white/70 mb-6">¿Eliminar el homenaje a <strong>{deletingMemorial.name}</strong>?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeletingMemorial(null)} className="px-5 py-2 rounded-lg border-4 border-white/80 text-white hover:bg-white/10 transition text-sm font-medium">Cancelar</button>
                <button onClick={handleDelete} className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm font-medium">Eliminar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
