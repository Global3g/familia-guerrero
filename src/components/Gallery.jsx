import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, ZoomIn, Filter, Plus, Pencil, Trash2, Save, Loader2 } from 'lucide-react'
import { galleryCategories } from '../data/familyData'
import { getGalleryPhotos, saveGalleryPhoto, deleteGalleryPhoto, uploadPhoto, getUpcomingEvents } from '../firebase/familyService'
import Modal from './Modal'
import { SkeletonGallery } from './Skeleton'

// Gradient palettes for photo placeholders
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

// Varying heights for masonry effect
const heights = [
  'h-52', 'h-64', 'h-72', 'h-56', 'h-60',
  'h-68', 'h-48', 'h-72', 'h-56', 'h-64',
  'h-52', 'h-60',
]

const inputClass = 'w-full rounded-lg border border-[#7A9E7E]/20 bg-white px-3 py-2 text-sm text-[#5D4037] focus:outline-none focus:ring-2 focus:ring-[#7A9E7E]/30'
const labelClass = 'block text-xs font-medium text-[#5D4037] mb-1'

function PhotoForm({ isOpen, onClose, photoData, onSave, events }) {
  const [form, setForm] = useState({ caption: '', year: '', category: 'recuerdos', eventId: '', eventTitle: '' })
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
        {/* Photo upload */}
        <div className="flex justify-center">
          <label className="cursor-pointer group">
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full max-w-xs h-48 object-cover rounded-xl border-2 border-[#7A9E7E]/30 group-hover:opacity-80 transition" />
                <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/30 sm:opacity-0 sm:group-hover:opacity-100 transition">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xs h-48 rounded-xl border-2 border-dashed border-[#7A9E7E]/40 flex flex-col items-center justify-center text-[#7A9E7E] group-hover:border-[#7A9E7E] transition" style={{ minWidth: '280px' }}>
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
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-[#7A9E7E] px-6 py-2.5 text-white hover:bg-[#7A9E7E]/90 transition disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('todos')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [allEvents, setAllEvents] = useState([])
  const [editingPhoto, setEditingPhoto] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deletingPhoto, setDeletingPhoto] = useState(null)

  useEffect(() => {
    loadPhotos()
    loadEvents()
  }, [])

  const loadPhotos = async () => {
    setLoading(true)
    const data = await getGalleryPhotos()
    if (data.length > 0) setPhotos(data)
    setLoading(false)
  }

  const loadEvents = async () => {
    const data = await getUpcomingEvents()
    setAllEvents(data)
  }

  const displayPhotos = photos

  const filteredPhotos =
    activeCategory === 'todos'
      ? displayPhotos
      : displayPhotos.filter((p) => p.category === activeCategory)

  const handleSave = async (formData) => {
    const id = editingPhoto?.id || null
    await saveGalleryPhoto(id, formData)
    setEditingPhoto(null)
    setShowCreateForm(false)
    await loadPhotos()
  }

  const handleDelete = async () => {
    if (deletingPhoto?.id) {
      await deleteGalleryPhoto(deletingPhoto.id)
      setDeletingPhoto(null)
      await loadPhotos()
    }
  }

  return (
    <section
      id="galeria"
      className="py-20 px-4"
      style={{ backgroundColor: '#FDF8F0' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span
            className="inline-flex items-center gap-2 text-sm font-medium tracking-wide uppercase mb-3"
            style={{ color: '#7A9E7E' }}
          >
            <Camera className="w-4 h-4" />
            Galeria Familiar
          </span>
          <h2
            className="text-4xl md:text-5xl font-serif font-bold mb-4"
            style={{ color: '#3D2C2C', fontFamily: "'Playfair Display', serif" }}
          >
            Nuestros Recuerdos
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#6B5B5B' }}>
            Momentos que atesoramos para siempre. Cada foto cuenta una historia
            de amor, risas y union.
          </p>
        </motion.div>

        {/* Filter buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          <span className="flex items-center mr-2" style={{ color: '#7A9E7E' }}>
            <Filter className="w-4 h-4" />
          </span>
          {galleryCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
              style={
                activeCategory === cat.id
                  ? {
                      backgroundColor: '#C4704B',
                      color: '#fff',
                      boxShadow: '0 4px 14px rgba(196,112,75,0.35)',
                    }
                  : {
                      backgroundColor: '#fff',
                      color: '#6B5B5B',
                      border: '1px solid #E0D5C8',
                    }
              }
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Drag and drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#7A9E7E]', 'bg-[#7A9E7E]/5') }}
          onDragLeave={(e) => { e.currentTarget.classList.remove('border-[#7A9E7E]', 'bg-[#7A9E7E]/5') }}
          onDrop={async (e) => {
            e.preventDefault()
            e.currentTarget.classList.remove('border-[#7A9E7E]', 'bg-[#7A9E7E]/5')
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
            for (const file of files) {
              const url = await uploadPhoto(file, `gallery/drop-${Date.now()}`)
              if (url) await saveGalleryPhoto(null, { photoURL: url, caption: file.name, category: 'recuerdos', year: new Date().getFullYear() })
            }
            await loadPhotos()
          }}
          className="mb-6 border-2 border-dashed border-[#E0D5C8] rounded-2xl p-8 text-center transition-colors cursor-pointer"
          onClick={() => setShowCreateForm(true)}
        >
          <Camera className="w-8 h-8 mx-auto mb-2 text-[#C4704B]/40" />
          <p className="text-sm text-[#5D4037]/50">Arrastra fotos aqui o haz clic para agregar</p>
        </div>

        {/* Masonry grid */}
        {loading ? (
          <SkeletonGallery count={6} />
        ) : (
        <motion.div
          layout
          className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5"
        >
          <AnimatePresence mode="popLayout">
            {filteredPhotos.map((photo, idx) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="break-inside-avoid mb-5"
              >
                <div
                  className="group relative rounded-xl overflow-hidden shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  style={{ backgroundColor: '#fff' }}
                >
                  {/* Edit/Delete buttons */}
                  <div className="absolute top-2 left-2 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={(e) => { e.stopPropagation(); setEditingPhoto(photo); }} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 hover:bg-[#B8943E]/10 shadow text-[#B8943E] transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeletingPhoto(photo); }} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 hover:bg-red-50 shadow text-red-400 hover:text-red-600 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Photo area */}
                  <div
                    onClick={() => setSelectedPhoto(photo)}
                    className={`${heights[idx % heights.length]} w-full relative flex items-center justify-center ${photo.photoURL ? '' : `bg-gradient-to-br ${gradients[idx % gradients.length]}`}`}
                  >
                    {photo.photoURL ? (
                      <img src={photo.photoURL} alt={photo.caption} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" style={{ color: 'rgba(255,255,255,0.6)' }} />
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Year badge */}
                    <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#C4704B' }}>
                      {photo.year}
                    </span>
                  </div>

                  {/* Caption */}
                  <div className="p-4" onClick={() => setSelectedPhoto(photo)}>
                    <p className="text-sm font-medium leading-snug" style={{ color: '#3D2C2C' }}>
                      {photo.caption}
                    </p>
                    <span className="inline-block mt-2 text-xs font-medium capitalize px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0E8DE', color: '#7A9E7E' }}>
                      {photo.category}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        )}

        {/* Empty state */}
        {!loading && filteredPhotos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-[#C4704B]/10 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-[#C4704B]/50" />
            </div>
            <p className="text-lg font-serif font-bold text-[#5D4037]/60 mb-2">
              {displayPhotos.length === 0 ? 'Sin fotos todavia' : 'Sin fotos en esta categoria'}
            </p>
            <p className="text-sm text-[#5D4037]/40 mb-6">
              {displayPhotos.length === 0 ? 'Sube la primera foto de tu familia' : 'Agrega fotos a esta categoria'}
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C4704B] text-white hover:bg-[#C4704B]/90 transition font-medium shadow-md"
            >
              <Plus className="w-5 h-5" />
              {displayPhotos.length === 0 ? 'Subir primera foto' : 'Agregar foto'}
            </button>
          </motion.div>
        )}
        {/* Add photo button */}
        {filteredPhotos.length > 0 && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-[#7A9E7E]/40 text-[#7A9E7E] hover:bg-[#7A9E7E]/5 hover:border-[#7A9E7E] transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Agregar foto
            </button>
          </div>
        )}
      </div>

      {/* Photo form modals */}
      <PhotoForm isOpen={editingPhoto !== null} onClose={() => setEditingPhoto(null)} photoData={editingPhoto} onSave={handleSave} events={allEvents} />
      <PhotoForm isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} photoData={null} onSave={handleSave} events={allEvents} />

      {/* Delete confirmation */}
      <AnimatePresence>
        {deletingPhoto && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingPhoto(null)} />
            <motion.div className="relative bg-[#FFF8F0] rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3 className="text-lg font-serif font-bold text-[#5D4037] mb-2">Eliminar foto</h3>
              <p className="text-sm text-[#5D4037]/70 mb-6">¿Eliminar <strong>"{deletingPhoto.caption}"</strong>?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeletingPhoto(null)} className="px-5 py-2 rounded-lg border border-[#C4704B]/20 text-[#5D4037] hover:bg-[#FAF6EE] transition text-sm font-medium">Cancelar</button>
                <button onClick={handleDelete} className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm font-medium">Eliminar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.35, type: 'spring', damping: 25 }}
              className="relative max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: '#fff' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: '#fff',
                }}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Large photo */}
              <div className={`h-72 sm:h-[500px] w-full flex items-center justify-center ${selectedPhoto.photoURL ? 'bg-black' : `bg-gradient-to-br ${gradients[((selectedPhoto.id || 1) - 1) % gradients.length]}`}`}>
                {selectedPhoto.photoURL ? (
                  <img src={selectedPhoto.photoURL} alt={selectedPhoto.caption} className="w-full h-full object-contain" />
                ) : (
                  <Camera className="w-16 h-16" style={{ color: 'rgba(255,255,255,0.5)' }} />
                )}
              </div>

              {/* Photo info */}
              <div className="p-6 sm:p-8">
                <h3
                  className="text-xl sm:text-2xl font-serif font-bold mb-2"
                  style={{
                    color: '#3D2C2C',
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {selectedPhoto.caption}
                </h3>
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#C4704B', color: '#fff' }}
                  >
                    {selectedPhoto.year}
                  </span>
                  <span
                    className="text-sm font-medium capitalize px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: '#EBF5EC',
                      color: '#7A9E7E',
                    }}
                  >
                    {selectedPhoto.category}
                  </span>
                  {selectedPhoto.eventTitle && (
                    <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#FBF6EA', color: '#B8943E' }}>
                      {selectedPhoto.eventTitle}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
