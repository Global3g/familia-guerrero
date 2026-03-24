import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Gift, Heart, Users, PartyPopper, Star, Plus, Pencil, Trash2, Save, Loader2, Camera } from 'lucide-react'
import { getUpcomingEvents, saveUpcomingEvent, deleteUpcomingEvent, getGalleryPhotos } from '../firebase/familyService'
import Modal from './Modal'
import { SkeletonGrid } from './Skeleton'

// Color mapping by event type
const typeStyles = {
  'cumpleaños': {
    bg: '#FDF0EB',
    accent: '#C4704B',
    iconBg: '#C4704B',
    border: '#E8C4B4',
    label: 'Cumpleaños',
  },
  aniversario: {
    bg: '#FBF6EA',
    accent: '#B8943E',
    iconBg: '#B8943E',
    border: '#E0D5A8',
    label: 'Aniversario',
  },
  reunion: {
    bg: '#EEF6EF',
    accent: '#7A9E7E',
    iconBg: '#7A9E7E',
    border: '#BDD4BF',
    label: 'Reunion',
  },
  celebracion: {
    bg: '#FEF0EC',
    accent: '#E8956D',
    iconBg: '#E8956D',
    border: '#F0C8B4',
    label: 'Celebracion',
  },
}

// Icon mapping by event type
const typeIcons = {
  'cumpleaños': Gift,
  aniversario: Heart,
  reunion: Users,
  celebracion: PartyPopper,
}

// Month names in Spanish
const monthNames = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

const monthNamesFull = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return { year, month, day }
}

function getDayName(dateStr) {
  const date = new Date(dateStr + 'T12:00:00')
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
  return days[date.getDay()]
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

const inputClass = 'w-full rounded-lg border border-[#7A9E7E]/20 bg-white px-3 py-2 text-sm text-[#5D4037] focus:outline-none focus:ring-2 focus:ring-[#7A9E7E]/30'
const labelClass = 'block text-xs font-medium text-[#5D4037] mb-1'

const eventTypeOptions = [
  { value: 'cumpleaños', label: 'Cumpleaños' },
  { value: 'aniversario', label: 'Aniversario' },
  { value: 'reunion', label: 'Reunion' },
  { value: 'celebracion', label: 'Celebracion' },
]

function EventForm({ isOpen, onClose, eventData, onSave }) {
  const [form, setForm] = useState({ title: '', date: '', type: 'cumpleaños', location: '', description: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm({
      title: eventData?.title || '',
      date: eventData?.date || '',
      type: eventData?.type || 'cumpleaños',
      location: eventData?.location || '',
      description: eventData?.description || '',
    })
  }, [eventData, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      console.error('Error saving event:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={eventData ? 'Editar Evento' : 'Nuevo Evento'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Titulo</label>
          <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className={inputClass} required placeholder="Ej. Cumpleaños de Sofia" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Fecha</label>
            <input type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Tipo</label>
            <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))} className={inputClass}>
              {eventTypeOptions.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Lugar</label>
          <input type="text" value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} className={inputClass} placeholder="Ciudad o direccion" />
        </div>
        <div>
          <label className={labelClass}>Descripcion</label>
          <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className={inputClass + ' resize-none'} placeholder="Detalles del evento..." />
        </div>
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

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [editingEvent, setEditingEvent] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState(null)
  const [tab, setTab] = useState('proximos')

  useEffect(() => {
    loadEvents()
    loadPhotos()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    const data = await getUpcomingEvents()
    if (data.length > 0) setEvents(data)
    setLoading(false)
  }

  const loadPhotos = async () => {
    const data = await getGalleryPhotos()
    setGalleryPhotos(data)
  }

  const getEventPhotos = (eventId) => galleryPhotos.filter((p) => p.eventId === eventId)

  const allEvents = events
  const today = new Date().toISOString().split('T')[0]
  const upcoming = allEvents.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = allEvents.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date))
  const displayEvents = tab === 'proximos' ? upcoming : past

  const handleSave = async (formData) => {
    const id = editingEvent?.id || null
    await saveUpcomingEvent(id, formData)
    setEditingEvent(null)
    setShowCreateForm(false)
    await loadEvents()
  }

  const handleDelete = async () => {
    if (deletingEvent?.id) {
      await deleteUpcomingEvent(deletingEvent.id)
      setDeletingEvent(null)
      await loadEvents()
    }
  }

  return (
    <section
      id="eventos"
      className="py-20 px-4"
      style={{ backgroundColor: '#FAF7F2' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span
            className="inline-flex items-center gap-2 text-sm font-medium tracking-wide uppercase mb-3"
            style={{ color: '#C4704B' }}
          >
            <Calendar className="w-4 h-4" />
            Agenda Familiar
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4"
            style={{ color: '#5D4037', fontFamily: "'Playfair Display', serif" }}
          >
            Agenda Familiar
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#6B5B5B' }}>
            Las fechas que nos unen. Cada evento es parte de nuestra historia.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-10">
          <button
            onClick={() => setTab('proximos')}
            className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300"
            style={tab === 'proximos'
              ? { backgroundColor: '#C4704B', color: '#fff', boxShadow: '0 4px 14px rgba(196,112,75,0.35)' }
              : { backgroundColor: '#fff', color: '#6B5B5B', border: '1px solid #E0D5C8' }
            }
          >
            Proximos ({upcoming.length})
          </button>
          <button
            onClick={() => setTab('pasados')}
            className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300"
            style={tab === 'pasados'
              ? { backgroundColor: '#B8943E', color: '#fff', boxShadow: '0 4px 14px rgba(184,148,62,0.35)' }
              : { backgroundColor: '#fff', color: '#6B5B5B', border: '1px solid #E0D5C8' }
            }
          >
            Pasados ({past.length})
          </button>
        </div>

        {/* Event cards */}
        {loading ? (
          <SkeletonGrid count={6} />
        ) : (
        <motion.div
          key={tab}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {displayEvents.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="w-16 h-16 rounded-full bg-[#C4704B]/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-[#C4704B]/50" />
              </div>
              <p className="text-lg font-serif font-bold text-[#5D4037]/60 mb-2">
                {tab === 'proximos' ? 'Sin eventos proximos' : 'Sin eventos pasados'}
              </p>
              <p className="text-sm text-[#5D4037]/40 mb-6">
                {tab === 'proximos' ? 'Agrega un evento familiar para que todos esten informados' : 'Los eventos pasados apareceran aqui automaticamente'}
              </p>
              {tab === 'proximos' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C4704B] text-white hover:bg-[#C4704B]/90 transition font-medium shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Agregar primer evento
                </button>
              )}
            </div>
          )}
          {displayEvents.map((event) => {
            const { day, month } = parseDate(event.date)
            const style = typeStyles[event.type] || typeStyles.celebracion
            const IconComponent = typeIcons[event.type] || Star
            const dayName = getDayName(event.date)
            const isPast = event.date < today

            return (
              <motion.div
                key={event.id}
                variants={cardVariants}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className={`rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 relative group ${isPast ? 'opacity-80' : ''}`}
                style={{
                  backgroundColor: '#fff',
                  border: `2px solid ${style.border}`,
                }}
              >
                {/* Edit/Delete buttons */}
                <div className="absolute top-2 right-2 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => setEditingEvent(event)} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 hover:bg-[#B8943E]/10 shadow text-[#B8943E] transition">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeletingEvent(event)} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 hover:bg-red-50 shadow text-red-400 hover:text-red-600 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card top: date + type badge */}
                <div
                  className="relative p-5 flex items-center gap-5"
                  style={{ backgroundColor: style.bg }}
                >
                  {/* Date block */}
                  <div
                    className="flex-shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center shadow-sm"
                    style={{ backgroundColor: '#fff' }}
                  >
                    <span
                      className="text-3xl font-bold leading-none"
                      style={{ color: style.accent }}
                    >
                      {day}
                    </span>
                    <span
                      className="text-xs font-semibold uppercase tracking-wider mt-1"
                      style={{ color: '#6B5B5B' }}
                    >
                      {monthNames[month - 1]}
                    </span>
                  </div>

                  {/* Title and type */}
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1.5 px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: style.iconBg,
                        color: '#fff',
                      }}
                    >
                      <IconComponent className="w-3 h-3" />
                      {style.label}
                    </span>
                    <h3
                      className="text-lg font-serif font-bold leading-tight truncate"
                      style={{
                        color: '#3D2C2C',
                        fontFamily: "'Playfair Display', serif",
                      }}
                    >
                      {event.title}
                    </h3>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 space-y-3">
                  <p className="text-sm leading-relaxed" style={{ color: '#6B5B5B' }}>
                    {event.description}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    {/* Location */}
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" style={{ color: style.accent }} />
                      <span
                        className="text-xs font-medium"
                        style={{ color: '#6B5B5B' }}
                      >
                        {event.location}
                      </span>
                    </div>

                    {/* Day of week */}
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: style.bg,
                        color: style.accent,
                      }}
                    >
                      {dayName}
                    </span>
                  </div>

                  {/* Full date line */}
                  <div
                    className="flex items-center gap-1.5 pt-1 border-t"
                    style={{ borderColor: '#F0E8DE' }}
                  >
                    <Calendar className="w-3.5 h-3.5" style={{ color: '#B0A090' }} />
                    <span className="text-xs" style={{ color: '#B0A090' }}>
                      {day} de {monthNamesFull[month - 1]},{' '}
                      {parseDate(event.date).year}
                    </span>
                  </div>

                  {/* Linked photos */}
                  {(() => {
                    const photos = getEventPhotos(event.id)
                    if (photos.length === 0) return null
                    return (
                      <div className="pt-2 border-t" style={{ borderColor: '#F0E8DE' }}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Camera className="w-3.5 h-3.5" style={{ color: style.accent }} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#6B5B5B' }}>
                            {photos.length} foto{photos.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto">
                          {photos.slice(0, 4).map((p, pi) => (
                            <div key={pi} className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-[#E0D5C8]">
                              {p.photoURL ? (
                                <img src={p.photoURL} alt={p.caption} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                                  <Camera className="w-4 h-4 text-white/60" />
                                </div>
                              )}
                            </div>
                          ))}
                          {photos.length > 4 && (
                            <div className="w-14 h-14 rounded-lg flex-shrink-0 bg-[#FAF6EE] flex items-center justify-center border border-[#E0D5C8]">
                              <span className="text-xs font-bold" style={{ color: style.accent }}>+{photos.length - 4}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
        )}

        {/* Add event button */}
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-[#7A9E7E]/40 text-[#7A9E7E] hover:bg-[#7A9E7E]/5 hover:border-[#7A9E7E] transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Agregar evento
          </button>
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <div
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full"
            style={{ backgroundColor: '#EBF5EC' }}
          >
            <Star className="w-4 h-4" style={{ color: '#7A9E7E' }} />
            <span className="text-sm font-medium" style={{ color: '#5A7E5E' }}>
              Cada encuentro es una oportunidad para crear nuevos recuerdos
            </span>
            <Star className="w-4 h-4" style={{ color: '#7A9E7E' }} />
          </div>
        </motion.div>
      </div>

      {/* Event form modals */}
      <EventForm isOpen={editingEvent !== null} onClose={() => setEditingEvent(null)} eventData={editingEvent} onSave={handleSave} />
      <EventForm isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} eventData={null} onSave={handleSave} />

      {/* Delete confirmation */}
      <AnimatePresence>
        {deletingEvent && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingEvent(null)} />
            <motion.div className="relative bg-[#FFF8F0] rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3 className="text-lg font-serif font-bold text-[#5D4037] mb-2">Eliminar evento</h3>
              <p className="text-sm text-[#5D4037]/70 mb-6">¿Eliminar <strong>"{deletingEvent.title}"</strong>?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeletingEvent(null)} className="px-5 py-2 rounded-lg border border-[#C4704B]/20 text-[#5D4037] hover:bg-[#FAF6EE] transition text-sm font-medium">Cancelar</button>
                <button onClick={handleDelete} className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm font-medium">Eliminar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
