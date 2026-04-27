import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, ZoomIn, Filter, Plus, Pencil, Trash2, Save, Loader2, Users, Calendar, MapPin, Tag, RefreshCw, ChevronLeft, ChevronRight, Image, Clock, Heart } from 'lucide-react'
import { galleryCategories } from '../data/familyData'
import { getGalleryPhotos, saveGalleryPhoto, deleteGalleryPhoto, uploadPhoto, getUpcomingEvents, getFamilyMembers, getGrandparents } from '../firebase/familyService'
import Modal from './Modal'
import sounds from '../utils/sounds'
import { SkeletonGallery } from './Skeleton'

const gradients = [
  'from-amber-200 to-orange-300',
  'from-rose-200 to-pink-300',
  'from-teal-200 to-emerald-300',
  'from-violet-200 to-purple-300',
  'from-sky-200 to-blue-300',
  'from-lime-200 to-green-300',
  'from-amber-300 to-yellow-200',
  'from-fuchsia-200 to-rose-300',
  'from-cyan-200 to-teal-300',
  'from-indigo-200 to-violet-300',
  'from-orange-200 to-red-300',
  'from-emerald-200 to-cyan-300',
]

const heights = [
  'h-52', 'h-64', 'h-72', 'h-56', 'h-60',
  'h-68', 'h-48', 'h-72', 'h-56', 'h-64',
  'h-52', 'h-60',
]

const inputClass = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6B9080]/30'
const labelClass = 'block text-xs font-medium text-white mb-1'

// ── Helper: build nucleus family title (matches FamilyTree logic) ──
function getLastName(fullName) {
  if (!fullName) return 'Familia'
  const parts = fullName.trim().split(' ')
  if (parts.length >= 2) return parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1]
  return parts[0]
}

function getNucleusName(member) {
  const sp = member.spouse
  const spouseName = sp ? (typeof sp === 'object' ? sp.name : sp) : null
  const spouseGender = sp && typeof sp === 'object' ? sp.gender : null
  const memberLastName = member.lastName || getLastName(member.name || member.fullName)
  const spouseLastName = sp && typeof sp === 'object' && sp.lastName ? sp.lastName : (spouseName ? getLastName(spouseName) : null)

  if (!spouseLastName) return `Familia ${memberLastName}`
  if (member.gender === 'M') return `Familia ${memberLastName} ${spouseLastName}`
  if (member.gender === 'F') return `Familia ${spouseLastName} ${memberLastName}`
  if (spouseGender === 'M') return `Familia ${spouseLastName} ${memberLastName}`
  if (spouseGender === 'F') return `Familia ${memberLastName} ${spouseLastName}`
  return `Familia ${memberLastName} ${spouseLastName}`
}

// ── Helper: build all nucleus options from members sorted by birthDate ──
function buildNucleusOptions(members, grandparentsData) {
  const sorted = [...members].sort((a, b) => {
    if (!a.birthDate && !b.birthDate) return 0
    if (!a.birthDate) return 1
    if (!b.birthDate) return -1
    return a.birthDate.localeCompare(b.birthDate)
  })
  // Build raw names first, then disambiguate duplicates
  const rawNames = sorted.map(m => getNucleusName(m))
  const countMap = {}
  rawNames.forEach(n => { countMap[n] = (countMap[n] || 0) + 1 })
  const options = []
  if (grandparentsData) options.push('Abuelos')
  sorted.forEach((member, i) => {
    const base = rawNames[i]
    if (countMap[base] > 1) {
      const firstName = (member.name || member.fullName || '').trim().split(' ')[0]
      options.push(`${base} (${firstName})`)
    } else {
      options.push(base)
    }
  })
  return options
}

// ── Helper: extract inline photos from family members ──
function extractMemberPhotos(members, grandparentsData) {
  const photos = []

  const addPersonPhotos = (person, nucleusName) => {
    if (!person || !person.gallery || person.gallery.length === 0) return
    person.gallery.forEach(g => {
      photos.push({
        ...g,
        _source: 'member',
        nucleus: nucleusName,
        owner: person.name?.split(' ')[0] || nucleusName,
        year: g.year || null,
        category: g.category || 'recuerdos',
      })
    })
  }

  // Grandparents photos
  if (grandparentsData) {
    const gf = grandparentsData.grandfather
    const gm = grandparentsData.grandmother
    if (gf) addPersonPhotos(gf, 'Abuelos')
    if (gm) addPersonPhotos(gm, 'Abuelos')
  }

  // Build disambiguated names (same logic as buildNucleusOptions)
  const rawNames = members.map(m => getNucleusName(m))
  const countMap = {}
  rawNames.forEach(n => { countMap[n] = (countMap[n] || 0) + 1 })

  // Members and their descendants
  members.forEach((member, i) => {
    const base = rawNames[i]
    const nucleusName = countMap[base] > 1
      ? `${base} (${(member.name || member.fullName || '').trim().split(' ')[0]})`
      : base

    addPersonPhotos(member, nucleusName)
    if (member.spouse && typeof member.spouse === 'object') {
      addPersonPhotos(member.spouse, nucleusName)
    }

    const walkChildren = (children) => {
      (children || []).filter(c => c && c !== null).forEach(child => {
        addPersonPhotos(child, nucleusName)
        if (child.spouse && typeof child.spouse === 'object') {
          addPersonPhotos(child.spouse, nucleusName)
        }
        if (child.children) walkChildren(child.children)
      })
    }
    if (member.children) walkChildren(member.children)
  })

  return photos
}

// ── Collage layout presets ──
const collageSlots = [
  { w: 'col-span-2 row-span-2', rotate: -2 },
  { w: 'col-span-1 row-span-1', rotate: 3 },
  { w: 'col-span-1 row-span-2', rotate: -1 },
  { w: 'col-span-1 row-span-1', rotate: 2 },
  { w: 'col-span-1 row-span-1', rotate: -3 },
  { w: 'col-span-2 row-span-1', rotate: 1 },
  { w: 'col-span-1 row-span-1', rotate: -2 },
  { w: 'col-span-1 row-span-2', rotate: 2 },
  { w: 'col-span-1 row-span-1', rotate: -1 },
  { w: 'col-span-2 row-span-1', rotate: 3 },
  { w: 'col-span-1 row-span-1', rotate: -2 },
  { w: 'col-span-1 row-span-1', rotate: 1 },
  { w: 'col-span-1 row-span-1', rotate: -3 },
  { w: 'col-span-2 row-span-1', rotate: 2 },
  { w: 'col-span-1 row-span-1', rotate: -1 },
]

function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// ── Photo Collage Hero ──
function PhotoCollage({ photos, onPhotoClick }) {
  const [collagePhotos, setCollagePhotos] = useState([])
  const [shuffleKey, setShuffleKey] = useState(0)

  const pickPhotos = useCallback(() => {
    const withImages = photos.filter(p => p.photoURL)
    if (withImages.length === 0) return
    const shuffled = shuffleArray(withImages)
    setCollagePhotos(shuffled.slice(0, Math.min(15, shuffled.length)))
    setShuffleKey(k => k + 1)
  }, [photos])

  useEffect(() => { pickPhotos() }, [pickPhotos])

  if (collagePhotos.length < 3) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="mb-14 relative"
    >
      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 auto-rows-[80px] sm:auto-rows-[100px] gap-2 sm:gap-3">
        <AnimatePresence mode="wait">
          {collagePhotos.map((photo, i) => {
            const slot = collageSlots[i % collageSlots.length]
            return (
              <motion.div
                key={`${shuffleKey}-${i}`}
                className={`${slot.w} relative rounded-xl overflow-hidden cursor-pointer group`}
                style={{ transform: `rotate(${slot.rotate}deg)` }}
                initial={{ opacity: 0, scale: 0.7, rotate: slot.rotate * 3 }}
                animate={{ opacity: 1, scale: 1, rotate: slot.rotate }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.5, delay: i * 0.06, type: 'spring', damping: 20 }}
                onClick={() => onPhotoClick(photo)}
              >
                <img
                  src={photo.photoURL}
                  alt={photo.caption || ''}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-[10px] text-white font-medium truncate">{photo.caption}</p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Shuffle button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={pickPhotos}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Mezclar fotos
        </button>
      </div>
    </motion.div>
  )
}

// ── Film Strip Marquee ──
function FilmStripMarquee({ photos }) {
  const withImages = useMemo(() => {
    const filtered = photos.filter(p => p.photoURL)
    if (filtered.length < 4) return []
    const shuffled = shuffleArray(filtered)
    return shuffled.slice(0, Math.min(20, shuffled.length))
  }, [photos])

  if (withImages.length < 4) return null

  // Duplicate for seamless loop
  const strip = [...withImages, ...withImages]

  return (
    <div className="mb-14 relative overflow-hidden">
      {/* Film perforations top */}
      <div className="h-5 bg-[#1a1a2e] flex items-center justify-around px-3">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="w-3 h-2 rounded-sm bg-white/10" />
        ))}
      </div>

      <div className="relative bg-[#1a1a2e] py-4 overflow-hidden">
        <motion.div
          className="flex gap-3"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ x: { repeat: Infinity, repeatType: 'loop', duration: withImages.length * 3, ease: 'linear' } }}
          style={{ width: 'fit-content' }}
        >
          {strip.map((photo, i) => (
            <div
              key={`strip-${i}`}
              className="flex-shrink-0 w-64 h-48 sm:w-80 sm:h-60 rounded-xl overflow-hidden relative group"
            >
              <img src={photo.photoURL} alt={photo.caption || ''} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="absolute bottom-1.5 left-2 right-2 text-[9px] text-white truncate">{photo.caption}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Film perforations bottom */}
      <div className="h-5 bg-[#1a1a2e] flex items-center justify-around px-3">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="w-3 h-2 rounded-sm bg-white/10" />
        ))}
      </div>

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0F172A] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0F172A] to-transparent z-10 pointer-events-none" />
    </div>
  )
}

// ── Animated Counter ──
function AnimatedCounter({ value, label, icon: Icon, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!ref.current || hasAnimated.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true
        const duration = 1500
        const steps = 40
        const increment = value / steps
        let current = 0
        const timer = setInterval(() => {
          current += increment
          if (current >= value) {
            setCount(value)
            clearInterval(timer)
          } else {
            setCount(Math.floor(current))
          }
        }, duration / steps)
      }
    }, { threshold: 0.5 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#B8654A]" />
      </div>
      <span className="text-3xl sm:text-4xl font-serif font-bold text-white">{count}{suffix}</span>
      <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ── Stats Bar ──
function GalleryStats({ photos, nucleusCount }) {
  const totalPhotos = photos.length
  const yearsSet = new Set(photos.map(p => p.year).filter(Boolean))
  const yearSpan = yearsSet.size > 0 ? Math.max(...yearsSet) - Math.min(...yearsSet) : 0

  if (totalPhotos === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-14 flex justify-center gap-8 sm:gap-14"
    >
      <AnimatedCounter value={totalPhotos} label="Fotos" icon={Image} />
      <AnimatedCounter value={nucleusCount} label="Nucleos" icon={Users} />
      {yearSpan > 0 && <AnimatedCounter value={yearSpan} label="Años de historia" icon={Clock} suffix="+" />}
    </motion.div>
  )
}

// ── Featured Photo / "Recuerdo del momento" ──
function FeaturedPhoto({ photos, onPhotoClick }) {
  const [featured, setFeatured] = useState(null)
  const [fadeKey, setFadeKey] = useState(0)

  const pickFeatured = useCallback(() => {
    const withImages = photos.filter(p => p.photoURL && p.caption)
    if (withImages.length === 0) return
    const pick = withImages[Math.floor(Math.random() * withImages.length)]
    setFeatured(pick)
    setFadeKey(k => k + 1)
  }, [photos])

  useEffect(() => { pickFeatured() }, [pickFeatured])

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (photos.filter(p => p.photoURL && p.caption).length < 2) return
    const timer = setInterval(pickFeatured, 8000)
    return () => clearInterval(timer)
  }, [pickFeatured, photos])

  if (!featured) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-14"
    >
      <div className="flex items-center gap-2 justify-center mb-4">
        <Heart className="w-4 h-4 text-[#B8654A]" />
        <span className="text-xs font-medium uppercase tracking-[3px] text-white/40">Recuerdo del momento</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={fadeKey}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden cursor-pointer group"
          onClick={() => onPhotoClick(featured)}
        >
          <div className="h-64 sm:h-96 w-full relative">
            <img src={featured.photoURL} alt={featured.caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <p className="text-xl sm:text-2xl font-serif font-bold text-white mb-2">{featured.caption}</p>
              <div className="flex items-center gap-3">
                {featured.year && <span className="text-sm px-3 py-1 rounded-full bg-white/20 text-white">{featured.year}</span>}
                {featured.nucleus && <span className="text-sm px-3 py-1 rounded-full bg-[#6B9080]/30 text-[#6B9080]">{featured.nucleus}</span>}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

// ── Photo Form ──
function PhotoForm({ isOpen, onClose, photoData, onSave, events, nucleusOptions }) {
  const [form, setForm] = useState({ caption: '', year: '', category: 'recuerdos', eventId: '', eventTitle: '', nucleus: '' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm({
      caption: photoData?.caption || '',
      year: photoData?.year || '',
      category: photoData?.category || 'recuerdos',
      eventId: photoData?.eventId || '',
      eventTitle: photoData?.eventTitle || '',
      nucleus: photoData?.nucleus || '',
    })
    setFile(null)
    setPreview(photoData?.photoURL || null)
  }, [photoData, isOpen])

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let photoURL = photoData?.photoURL || null
      if (file) {
        photoURL = await uploadPhoto(file, `gallery/${Date.now()}`)
      }
      await onSave({
        ...form,
        year: parseInt(form.year) || new Date().getFullYear(),
        photoURL,
      })
      onClose()
    } catch (err) {
      console.error('Error saving photo:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={photoData ? 'Editar Foto' : 'Nueva Foto'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center">
          <label className="cursor-pointer group">
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full max-w-xs h-48 object-cover rounded-xl border-2 border-[#6B9080]/30 group-hover:opacity-80 transition" />
                <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/30 sm:opacity-0 sm:group-hover:opacity-100 transition">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xs h-48 rounded-xl border-2 border-dashed border-[#6B9080]/40 flex flex-col items-center justify-center text-[#6B9080] group-hover:border-[#6B9080] transition" style={{ minWidth: '280px' }}>
                <Camera className="w-10 h-10 mb-2" />
                <span className="text-sm">Subir fotografia</span>
              </div>
            )}
          </label>
        </div>

        <div>
          <label className={labelClass}>Descripcion de la foto</label>
          <input type="text" value={form.caption} onChange={(e) => setForm(p => ({ ...p, caption: e.target.value }))} className={inputClass} required placeholder="Ej. Reunion familiar 2024" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Año</label>
            <input type="number" value={form.year} onChange={(e) => setForm(p => ({ ...p, year: e.target.value }))} className={inputClass} required placeholder="2024" />
          </div>
          <div>
            <label className={labelClass}>Categoria</label>
            <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} className={inputClass}>
              {galleryCategories.filter(c => c.id !== 'todos').map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Nucleus selector */}
        {nucleusOptions.length > 0 && (
          <div>
            <label className={labelClass}>Nucleo familiar (opcional)</label>
            <select value={form.nucleus} onChange={(e) => setForm(p => ({ ...p, nucleus: e.target.value }))} className={inputClass}>
              <option value="">Toda la familia</option>
              {nucleusOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}

        {/* Link to event */}
        {events && events.length > 0 && (
          <div>
            <label className={labelClass}>Vincular a evento (opcional)</label>
            <select
              value={form.eventId}
              onChange={(e) => {
                const ev = events.find(ev => ev.id === e.target.value)
                setForm(p => ({ ...p, eventId: e.target.value, eventTitle: ev?.title || '' }))
              }}
              className={inputClass}
            >
              <option value="">Sin evento</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title} ({ev.date})</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-[#6B9080] px-6 py-2.5 text-white hover:bg-[#6B9080]/90 transition disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Filter Pill ──
function FilterPill({ label, active, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5"
      style={
        active
          ? { backgroundColor: '#B8654A', color: '#fff', boxShadow: '0 2px 8px rgba(196,112,75,0.3)' }
          : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }
      }
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </button>
  )
}

// ── Main Gallery Component ──
export default function Gallery() {
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [members, setMembers] = useState([])
  const [grandparentsData, setGrandparentsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allEvents, setAllEvents] = useState([])
  const [editingPhoto, setEditingPhoto] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deletingPhoto, setDeletingPhoto] = useState(null)

  // Filters
  const [filterType, setFilterType] = useState('todos') // todos, año, nucleo, categoria, evento
  const [filterYear, setFilterYear] = useState(null)
  const [filterNucleus, setFilterNucleus] = useState(null)
  const [filterCategory, setFilterCategory] = useState(null)
  const [filterEvent, setFilterEvent] = useState(null)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    const [photos, mbrs, gp, evts] = await Promise.all([
      getGalleryPhotos(),
      getFamilyMembers(),
      getGrandparents(),
      getUpcomingEvents(),
    ])
    setGalleryPhotos(photos)
    setMembers(mbrs)
    setGrandparentsData(gp)
    setAllEvents(evts)
    setLoading(false)
  }

  // Merge both sources
  const allPhotos = useMemo(() => {
    const firestorePhotos = galleryPhotos.map(p => ({
      ...p,
      _source: 'firestore',
      nucleus: p.nucleus || '',
    }))
    const memberPhotos = extractMemberPhotos(members, grandparentsData)
    return [...firestorePhotos, ...memberPhotos]
  }, [galleryPhotos, members, grandparentsData])

  // Derive filter options
  const years = useMemo(() => {
    const yrs = [...new Set(allPhotos.map(p => p.year).filter(Boolean))].sort((a, b) => b - a)
    return yrs
  }, [allPhotos])

  const nucleusOptions = useMemo(() => {
    return buildNucleusOptions(members, grandparentsData)
  }, [members, grandparentsData])

  const eventOptions = useMemo(() => {
    const evts = [...new Set(allPhotos.filter(p => p.eventTitle).map(p => p.eventTitle))]
    return evts
  }, [allPhotos])

  // Apply filters
  const filteredPhotos = useMemo(() => {
    let result = allPhotos
    if (filterYear) result = result.filter(p => p.year === filterYear)
    if (filterNucleus) result = result.filter(p => p.nucleus === filterNucleus)
    if (filterCategory && filterCategory !== 'todos') result = result.filter(p => p.category === filterCategory)
    if (filterEvent) result = result.filter(p => p.eventTitle === filterEvent)
    return result
  }, [allPhotos, filterYear, filterNucleus, filterCategory, filterEvent])

  const clearFilters = () => {
    setFilterType('todos')
    setFilterYear(null)
    setFilterNucleus(null)
    setFilterCategory(null)
    setFilterEvent(null)
  }

  const hasActiveFilter = filterYear || filterNucleus || (filterCategory && filterCategory !== 'todos') || filterEvent

  const handleSave = async (formData) => {
    const id = editingPhoto?.id || null
    await saveGalleryPhoto(id, formData)
    sounds.save()
    setEditingPhoto(null)
    setShowCreateForm(false)
    await loadAll()
  }

  const handleDelete = async () => {
    if (deletingPhoto?.id && deletingPhoto._source !== 'member') {
      await deleteGalleryPhoto(deletingPhoto.id)
      sounds.delete()
      setDeletingPhoto(null)
      await loadAll()
    }
  }

  // Group photos by year for display
  const photosByYear = useMemo(() => {
    const grouped = {}
    filteredPhotos.forEach(p => {
      const year = p.year || 'Sin año'
      if (!grouped[year]) grouped[year] = []
      grouped[year].push(p)
    })
    return Object.entries(grouped).sort(([a], [b]) => b - a)
  }, [filteredPhotos])

  return (
    <section
      id="galeria"
      className="py-24 px-4"
      style={{ backgroundColor: '#0F172A' }}
    >
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-[11px] font-sans font-medium uppercase tracking-[5px] text-white/40 mb-4">Galeria</p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-5">
            Nuestros Recuerdos
          </h2>
          <div className="w-8 h-[1px] bg-[#B8654A] mx-auto mb-5" />
          <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
            Momentos que atesoramos para siempre. Cada foto cuenta una historia
            de amor, risas y union.
          </p>
          {!loading && (
            <p className="text-xs text-white/30 mt-3">{allPhotos.length} fotos en total</p>
          )}
        </motion.div>

        {/* ── Film Strip Marquee ── */}
        {!loading && <FilmStripMarquee photos={allPhotos} />}

        {/* ── Stats Bar ── */}
        {!loading && <GalleryStats photos={allPhotos} nucleusCount={nucleusOptions.length} />}

        {/* ── Featured Photo ── */}
        {!loading && <FeaturedPhoto photos={allPhotos} onPhotoClick={setSelectedPhoto} />}

        {/* ── Photo Collage Hero ── */}
        {!loading && <PhotoCollage photos={allPhotos} onPhotoClick={setSelectedPhoto} />}

        {/* ── Filter Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10 space-y-4"
        >
          {/* Filter type selector */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-white/30 mr-1">
              <Filter className="w-4 h-4" />
            </span>
            <FilterPill label="Todos" active={!hasActiveFilter} onClick={clearFilters} />
            <FilterPill label="Por Año" icon={Calendar} active={filterType === 'año' && !filterNucleus && !filterCategory && !filterEvent} onClick={() => { clearFilters(); setFilterType('año') }} />
            <FilterPill label="Por Nucleo" icon={Users} active={filterType === 'nucleo' && !filterYear && !filterCategory && !filterEvent} onClick={() => { clearFilters(); setFilterType('nucleo') }} />
            <FilterPill label="Por Categoria" icon={Tag} active={filterType === 'categoria' && !filterYear && !filterNucleus && !filterEvent} onClick={() => { clearFilters(); setFilterType('categoria') }} />
            {eventOptions.length > 0 && (
              <FilterPill label="Por Evento" icon={MapPin} active={filterType === 'evento' && !filterYear && !filterNucleus && !filterCategory} onClick={() => { clearFilters(); setFilterType('evento') }} />
            )}
          </div>

          {/* Sub-filters */}
          {filterType === 'año' && years.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => setFilterYear(filterYear === y ? null : y)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={filterYear === y
                    ? { backgroundColor: '#B8976A', color: '#fff' }
                    : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {filterType === 'nucleo' && nucleusOptions.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {nucleusOptions.map(n => (
                <button
                  key={n}
                  onClick={() => setFilterNucleus(filterNucleus === n ? null : n)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={filterNucleus === n
                    ? { backgroundColor: '#6B9080', color: '#fff' }
                    : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          {filterType === 'categoria' && (
            <div className="flex flex-wrap justify-center gap-2">
              {galleryCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={filterCategory === cat.id
                    ? { backgroundColor: '#B8654A', color: '#fff' }
                    : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {filterType === 'evento' && eventOptions.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {eventOptions.map(ev => (
                <button
                  key={ev}
                  onClick={() => setFilterEvent(filterEvent === ev ? null : ev)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={filterEvent === ev
                    ? { backgroundColor: '#B8976A', color: '#fff' }
                    : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {ev}
                </button>
              ))}
            </div>
          )}

          {/* Active filter indicator */}
          {hasActiveFilter && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-white/40">{filteredPhotos.length} de {allPhotos.length} fotos</span>
              <button onClick={clearFilters} className="text-xs text-[#B8654A] hover:text-[#B8654A]/80 transition flex items-center gap-1">
                <X className="w-3 h-3" /> Limpiar filtros
              </button>
            </div>
          )}
        </motion.div>

        {/* Drag and drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#6B9080]', 'bg-[#6B9080]/5') }}
          onDragLeave={(e) => { e.currentTarget.classList.remove('border-[#6B9080]', 'bg-[#6B9080]/5') }}
          onDrop={async (e) => {
            e.preventDefault()
            e.currentTarget.classList.remove('border-[#6B9080]', 'bg-[#6B9080]/5')
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
            for (const file of files) {
              const url = await uploadPhoto(file, `gallery/drop-${Date.now()}`)
              if (url) await saveGalleryPhoto(null, { photoURL: url, caption: file.name, category: 'recuerdos', year: new Date().getFullYear() })
            }
            await loadAll()
          }}
          className="mb-6 border-2 border-dashed border-white/20 bg-white/5 rounded-2xl p-8 text-center transition-colors cursor-pointer"
          onClick={() => setShowCreateForm(true)}
        >
          <Camera className="w-8 h-8 mx-auto mb-2 text-white/20" />
          <p className="text-sm text-white/40">Arrastra fotos aqui o haz clic para agregar</p>
        </div>

        {/* Masonry grid grouped by year */}
        {loading ? (
          <SkeletonGallery count={6} />
        ) : (
          photosByYear.map(([year, photos]) => (
            <div key={year} className="mb-8">
              <h3 className="text-lg font-serif font-bold text-white/60 mb-3 flex items-center gap-2">
                <span className="text-sm px-2 py-0.5 rounded-full bg-[#B8654A] text-white">{year}</span>
                <span className="text-xs text-white/30">{photos.length} fotos</span>
              </h3>
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
                <AnimatePresence mode="popLayout">
                  {photos.map((photo, idx) => {
                    const isMemberPhoto = photo._source === 'member'
                    return (
                    <motion.div
                      key={photo.id || `member-${idx}-${photo.photoURL}`}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      className="break-inside-avoid mb-5"
                    >
                      <div
                        className="glass-panel group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
                      >
                        {/* Edit/Delete buttons (only for firestore photos) */}
                        {!isMemberPhoto && (
                          <div className="absolute top-2 left-2 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20">
                            <button onClick={(e) => { e.stopPropagation(); setEditingPhoto(photo); }} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 hover:bg-[#B8976A]/10 shadow text-[#B8976A] transition">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeletingPhoto(photo); }} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 hover:bg-red-50 shadow text-red-400 hover:text-red-600 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Photo area */}
                        <div
                          onClick={() => setSelectedPhoto(photo)}
                          className={`${heights[idx % heights.length]} w-full relative flex items-center justify-center ${photo.photoURL ? '' : `bg-gradient-to-br ${gradients[idx % gradients.length]}`}`}
                        >
                          {photo.photoURL ? (
                            <img src={photo.photoURL} alt={photo.caption} className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-10 h-10 transition-transform duration-300 group-hover:scale-110 text-white/20" />
                          )}

                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" />
                          </div>

                          {/* Badges */}
                          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                            {photo.year && (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-white/60">
                                {photo.year}
                              </span>
                            )}
                            {photo.nucleus && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#6B9080]/20 text-[#6B9080]">
                                {photo.nucleus}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Caption */}
                        <div className="p-4" onClick={() => setSelectedPhoto(photo)}>
                          <p className="text-sm font-medium leading-snug text-white/70">
                            {photo.caption}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                              {photo.category}
                            </span>
                            {photo.owner && isMemberPhoto && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#B8976A]/10 text-[#B8976A]/70">
                                {photo.owner}
                              </span>
                            )}
                            {photo.eventTitle && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#B8654A]/10 text-[#B8654A]/70">
                                {photo.eventTitle}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )})}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}

        {/* Empty state */}
        {!loading && filteredPhotos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-[#B8654A]/10 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-[#B8654A]/50" />
            </div>
            <p className="text-lg font-serif font-bold text-white/50 mb-2">
              {hasActiveFilter ? 'Sin fotos con estos filtros' : (allPhotos.length === 0 ? 'Sin fotos todavia' : 'Sin fotos en esta categoria')}
            </p>
            <p className="text-sm text-white/50 mb-6">
              {hasActiveFilter ? 'Intenta con otros filtros o limpia la seleccion' : 'Sube la primera foto de tu familia'}
            </p>
            {hasActiveFilter ? (
              <button onClick={clearFilters} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white/60 hover:bg-white/5 transition font-medium">
                <X className="w-4 h-4" /> Limpiar filtros
              </button>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#B8654A] text-white hover:bg-[#B8654A]/90 transition font-medium shadow-md"
              >
                <Plus className="w-5 h-5" />
                Subir primera foto
              </button>
            )}
          </motion.div>
        )}

        {/* Add photo button */}
        {filteredPhotos.length > 0 && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-white/20 text-white/50 hover:bg-white/5 hover:border-white/40 transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Agregar foto
            </button>
          </div>
        )}
      </div>

      {/* Photo form modals */}
      <PhotoForm isOpen={editingPhoto !== null} onClose={() => setEditingPhoto(null)} photoData={editingPhoto} onSave={handleSave} events={allEvents} nucleusOptions={nucleusOptions} />
      <PhotoForm isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} photoData={null} onSave={handleSave} events={allEvents} nucleusOptions={nucleusOptions} />

      {/* Delete confirmation */}
      <AnimatePresence>
        {deletingPhoto && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingPhoto(null)} />
            <motion.div className="relative bg-[#1E293B] rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3 className="text-lg font-serif font-bold text-white mb-2">Eliminar foto</h3>
              {deletingPhoto._source === 'member' ? (
                <p className="text-sm text-white/70 mb-6">Esta foto pertenece al perfil de un miembro. Editala desde su perfil.</p>
              ) : (
                <p className="text-sm text-white/70 mb-6">¿Eliminar <strong>"{deletingPhoto.caption}"</strong>?</p>
              )}
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeletingPhoto(null)} className="px-5 py-2 rounded-lg border border-white/10 text-white hover:bg-white/10 transition text-sm font-medium">Cancelar</button>
                {deletingPhoto._source !== 'member' && (
                  <button onClick={handleDelete} className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm font-medium">Eliminar</button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox modal with navigation */}
      <AnimatePresence>
        {selectedPhoto && (() => {
          const photoList = filteredPhotos.length > 0 ? filteredPhotos : allPhotos
          const currentIdx = photoList.findIndex(p =>
            (p.id && p.id === selectedPhoto.id) || (p.photoURL === selectedPhoto.photoURL && p.caption === selectedPhoto.caption)
          )
          const hasPrev = currentIdx > 0
          const hasNext = currentIdx < photoList.length - 1 && currentIdx >= 0

          const goTo = (dir) => {
            const nextIdx = currentIdx + dir
            if (nextIdx >= 0 && nextIdx < photoList.length) setSelectedPhoto(photoList[nextIdx])
          }

          return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
            onClick={() => setSelectedPhoto(null)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' && hasPrev) goTo(-1)
              if (e.key === 'ArrowRight' && hasNext) goTo(1)
              if (e.key === 'Escape') setSelectedPhoto(null)
            }}
            tabIndex={0}
            ref={(el) => el?.focus()}
          >
            {/* Prev arrow */}
            {hasPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); goTo(-1) }}
                className="absolute left-2 sm:left-6 z-20 w-12 h-12 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 text-white transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next arrow */}
            {hasNext && (
              <button
                onClick={(e) => { e.stopPropagation(); goTo(1) }}
                className="absolute right-2 sm:right-6 z-20 w-12 h-12 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 text-white transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Counter */}
            {currentIdx >= 0 && (
              <div className="absolute top-4 left-4 z-20 text-xs text-white/50 bg-black/40 px-3 py-1 rounded-full">
                {currentIdx + 1} / {photoList.length}
              </div>
            )}

            <motion.div
              key={selectedPhoto.photoURL + selectedPhoto.caption}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.35, type: 'spring', damping: 25 }}
              className="relative max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
              >
                <X className="w-5 h-5" />
              </button>

              <div className={`h-72 sm:h-[500px] w-full flex items-center justify-center ${selectedPhoto.photoURL ? 'bg-black' : `bg-gradient-to-br ${gradients[0]}`}`}>
                {selectedPhoto.photoURL ? (
                  <img src={selectedPhoto.photoURL} alt={selectedPhoto.caption} className="w-full h-full object-contain" />
                ) : (
                  <Camera className="w-16 h-16" style={{ color: 'rgba(255,255,255,0.5)' }} />
                )}
              </div>

              <div className="p-6 sm:p-8">
                <h3
                  className="text-xl sm:text-2xl font-serif font-bold mb-2"
                  style={{ color: '#FFFFFF', fontFamily: "'Playfair Display', serif" }}
                >
                  {selectedPhoto.caption}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedPhoto.year && (
                    <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#B8654A', color: '#fff' }}>
                      {selectedPhoto.year}
                    </span>
                  )}
                  <span className="text-sm font-medium capitalize px-3 py-1 rounded-full" style={{ backgroundColor: '#EFF6FF', color: '#6B9080' }}>
                    {selectedPhoto.category}
                  </span>
                  {selectedPhoto.nucleus && (
                    <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(107,144,128,0.15)', color: '#6B9080' }}>
                      {selectedPhoto.nucleus}
                    </span>
                  )}
                  {selectedPhoto.eventTitle && (
                    <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#0F172A', color: '#B8976A' }}>
                      {selectedPhoto.eventTitle}
                    </span>
                  )}
                  {selectedPhoto.owner && selectedPhoto._source === 'member' && (
                    <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(184,151,106,0.15)', color: '#B8976A' }}>
                      Foto de {selectedPhoto.owner}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )})()}
      </AnimatePresence>
    </section>
  )
}
