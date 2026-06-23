import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Gift, Heart, Users, PartyPopper, Star, Plus, Pencil, Trash2, Save, Loader2, Camera } from 'lucide-react'
import { getUpcomingEvents, saveUpcomingEvent, deleteUpcomingEvent, getGalleryPhotos } from '../firebase/familyService'
import { useAuth } from '../firebase/useAuth'
import Modal from './Modal'
import { SkeletonGrid } from './Skeleton'

// Color mapping by event type
const typeStyles = {
  'cumpleaños': {
    bg: '#FDF0EB',
    accent: '#B8963E',
    iconBg: '#B8963E',
    border: '#E8C4B4',
    label: 'Cumpleaños',
  },
  aniversario: {
    bg: '#F8FAFC',
    accent: '#B8976A',
    iconBg: '#B8976A',
    border: '#E0D5A8',
    label: 'Aniversario',
  },
  reunion: {
    bg: '#EEF6EF',
    accent: '#6B9080',
    iconBg: '#6B9080',
    border: '#BDD4BF',
    label: 'Reunion',
  },
  celebracion: {
    bg: '#FEF0EC',
    accent: '#C8846A',
    iconBg: '#C8846A',
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

const inputClass = 'w-full rounded-lg border-4 border-white/80 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6B9080]/30'
const labelClass = 'block text-xs font-medium text-white mb-1'

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
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-[#6B9080] px-6 py-2.5 text-white hover:bg-[#6B9080]/90 transition disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function Events() {
  const { isAdmin } = useAuth()
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
      style={{ backgroundColor: '#F5F0E8' }}
    >
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-sans font-medium uppercase tracking-[5px] mb-4" style={{ color: '#8A8A8A' }}>Momentos</p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif italic font-bold mb-5" style={{ color: '#1C1C1C' }}>
            Agenda Familiar
          </h2>
          <div className="w-8 h-[1px] bg-[#B8963E] mx-auto mb-5" />
          <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: '#4A4A4A' }}>
            Las fechas que nos unen. Cada evento es parte de nuestra historia.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-10">
          <button
            onClick={() => setTab('proximos')}
            className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300"
            style={tab === 'proximos'
              ? { backgroundColor: '#B8963E', color: '#fff', boxShadow: '0 4px 14px rgba(184,150,62,0.35)' }
              : { backgroundColor: 'rgba(21,34,56,0.06)', color: '#4A4A4A', border: '1.5px solid rgba(184,150,62,0.3)' }
            }
          >
            Proximos ({upcoming.length})
          </button>
          <button
            onClick={() => setTab('pasados')}
            className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300"
            style={tab === 'pasados'
              ? { backgroundColor: '#B8963E', color: '#fff', boxShadow: '0 4px 14px rgba(184,150,62,0.35)' }
              : { backgroundColor: 'rgba(21,34,56,0.06)', color: '#4A4A4A', border: '1.5px solid rgba(184,150,62,0.3)' }
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
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(184,150,62,0.1)' }}>
                <Calendar className="w-8 h-8" style={{ color: '#B8963E' }} />
              </div>
              <p className="text-lg font-serif font-bold mb-2" style={{ color: '#1C1C1C' }}>
                {tab === 'proximos' ? 'Sin eventos proximos' : 'Sin eventos pasados'}
              </p>
              <p className="text-sm mb-6" style={{ color: '#8A8A8A' }}>
                {tab === 'proximos' ? 'Agrega un evento familiar para que todos esten informados' : 'Los eventos pasados apareceran aqui automaticamente'}
              </p>
              {tab === 'proximos' && isAdmin && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#B8963E] text-white hover:bg-[#B8963E]/90 transition font-medium shadow-md"
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
                  backgroundColor: '#FFFDF7',
                  border: '2px solid rgba(184,150,62,0.3)',
                }}
              >
                {/* Edit/Delete buttons */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => setEditingEvent(event)} className="w-7 h-7 rounded-full flex items-center justify-center shadow transition" style={{ backgroundColor: 'rgba(184,150,62,0.1)', color: '#B8963E' }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeletingEvent(event)} className="w-7 h-7 rounded-full flex items-center justify-center shadow transition text-red-400 hover:text-red-500" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Card top: date + type badge */}
                <div
                  className="relative p-8 flex items-center gap-5"
                  style={{ backgroundColor: 'rgba(184,150,62,0.04)' }}
                >
                  {/* Date block */}
                  <div
                    className="flex-shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center shadow-sm"
                    style={{ backgroundColor: 'rgba(184,150,62,0.08)', border: '1.5px solid rgba(184,150,62,0.2)' }}
                  >
                    <span
                      className="text-3xl font-bold leading-none"
                      style={{ color: style.accent }}
                    >
                      {day}
                    </span>
                    <span
                      className="text-xs font-semibold uppercase tracking-wider mt-1"
                      style={{ color: '#8A8A8A' }}
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
                      className="text-lg font-serif italic font-bold leading-tight truncate"
                      style={{ color: '#1C1C1C' }}
                    >
                      {event.title}
                    </h3>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-8 space-y-3">
                  <p className="text-sm leading-relaxed" style={{ color: '#4A4A4A' }}>
                    {event.description}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    {/* Location */}
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" style={{ color: style.accent }} />
                      <span
                        className="text-xs font-medium"
                        style={{ color: '#8A8A8A' }}
                      >
                        {event.location}
                      </span>
                    </div>

                    {/* Day of week */}
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'rgba(184,150,62,0.1)',
                        color: style.accent,
                      }}
                    >
                      {dayName}
                    </span>
                  </div>

                  {/* Full date line */}
                  <div
                    className="flex items-center gap-1.5 pt-1 border-t"
                    style={{ borderColor: 'rgba(184,150,62,0.2)' }}
                  >
                    <Calendar className="w-3.5 h-3.5" style={{ color: '#8A8A8A' }} />
                    <span className="text-xs" style={{ color: '#8A8A8A' }}>
                      {day} de {monthNamesFull[month - 1]},{' '}
                      {parseDate(event.date).year}
                    </span>
                  </div>

                  {/* Linked photos */}
                  {(() => {
                    const photos = getEventPhotos(event.id)
                    if (photos.length === 0) return null
                    return (
                      <div className="pt-2 border-t" style={{ borderColor: 'rgba(184,150,62,0.2)' }}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Camera className="w-3.5 h-3.5" style={{ color: style.accent }} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8A8A8A' }}>
                            {photos.length} foto{photos.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                          {photos.slice(0, 4).map((p, pi) => (
                            <div key={pi} className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0" style={{ border: '2px solid rgba(184,150,62,0.3)' }}>
                              {p.photoURL ? (
                                <img src={p.photoURL} alt={p.caption} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                                  <Camera className="w-6 h-6 text-amber-400/60" />
                                </div>
                              )}
                            </div>
                          ))}
                          {photos.length > 4 && (
                            <div className="w-24 h-24 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(184,150,62,0.08)', border: '2px solid rgba(184,150,62,0.3)' }}>
                              <span className="text-sm font-bold" style={{ color: style.accent }}>+{photos.length - 4}</span>
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
        {isAdmin && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl transition font-medium"
              style={{ border: '2px dashed rgba(184,150,62,0.4)', color: '#8A8A8A', backgroundColor: 'transparent' }}
            >
              <Plus className="w-5 h-5" />
              Agregar evento
            </button>
          </div>
        )}

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
            style={{ backgroundColor: 'rgba(184,150,62,0.08)', border: '1.5px solid rgba(184,150,62,0.2)' }}
          >
            <Star className="w-4 h-4" style={{ color: '#B8963E' }} />
            <span className="text-sm font-medium" style={{ color: '#4A4A4A' }}>
              Cada encuentro es una oportunidad para crear nuevos recuerdos
            </span>
            <Star className="w-4 h-4" style={{ color: '#B8963E' }} />
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
            <motion.div className="relative bg-[#1E293B] rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3 className="text-lg font-serif font-bold text-white mb-2">Eliminar evento</h3>
              <p className="text-sm text-white/70 mb-6">¿Eliminar <strong>"{deletingEvent.title}"</strong>?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeletingEvent(null)} className="px-5 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 transition text-sm font-medium">Cancelar</button>
                <button onClick={handleDelete} className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm font-medium">Eliminar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
