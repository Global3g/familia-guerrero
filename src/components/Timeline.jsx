import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Baby, Star, Users, Award, Calendar, Plus, Pencil, Trash2, Save, Loader2, X } from 'lucide-react';

import { getTimelineEvents, saveTimelineEvent, deleteTimelineEvent, getFamilyMembers, getGrandparents } from '../firebase/familyService';
import formatDate from '../utils/formatDate';
import { SkeletonTimeline } from './Skeleton';
import Modal from './Modal';
import sounds from '../utils/sounds';

const typeConfig = {
  nacimiento: {
    color: '#60D394',
    bgLight: 'rgba(96, 211, 148, 0.12)',
    border: 'rgba(96, 211, 148, 0.4)',
    icon: Baby,
    label: 'Nacimiento',
  },
  boda: {
    color: '#FF6B9D',
    bgLight: 'rgba(255, 107, 157, 0.12)',
    border: 'rgba(255, 107, 157, 0.4)',
    icon: Heart,
    label: 'Boda',
  },
  memorial: {
    color: '#A78BFA',
    bgLight: 'rgba(167, 139, 250, 0.12)',
    border: 'rgba(167, 139, 250, 0.4)',
    icon: Star,
    label: 'Memorial',
  },
  reunion: {
    color: '#FFD93D',
    bgLight: 'rgba(255, 217, 61, 0.10)',
    border: 'rgba(255, 217, 61, 0.35)',
    icon: Users,
    label: 'Reunion',
  },
  aniversario: {
    color: '#FF8A5B',
    bgLight: 'rgba(255, 138, 91, 0.12)',
    border: 'rgba(255, 138, 91, 0.4)',
    icon: Award,
    label: 'Aniversario',
  },
};

const defaultConfig = {
  color: '#FFFFFF',
  bgLight: 'rgba(93, 64, 55, 0.08)',
  border: 'rgba(93, 64, 55, 0.3)',
  icon: Calendar,
  label: 'Evento',
};

function TimelineEvent({ event, index, onEdit, onDelete, onPhotoClick }) {
  const isLeft = index % 2 === 0;
  const config = typeConfig[event.type] || defaultConfig;
  const IconComponent = config.icon;

  return (
    <div className="relative flex items-start md:items-center w-full mb-12 last:mb-0">
      {/* Desktop: alternating layout */}
      {/* Left content area */}
      <div className="hidden md:flex w-[calc(50%-28px)] items-center">
        {isLeft ? (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full"
          >
            <EventCard event={event} config={config} IconComponent={IconComponent} align="right" onEdit={onEdit} onDelete={onDelete} />
          </motion.div>
        ) : (
          event.personPhoto && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-end w-full"
            >
              <img src={event.personPhoto} alt="" className="w-24 h-24 rounded-full object-cover shadow-lg cursor-pointer hover:scale-110 transition-transform" style={{ border: `3px solid ${config.color}` }} onClick={() => onPhotoClick?.(event.personPhoto)} />
            </motion.div>
          )
        )}
      </div>

      {/* Center dot */}
      <div className="hidden md:flex w-14 justify-center relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="w-5 h-5 rounded-full border-4 shadow-md"
          style={{
            borderColor: config.color,
            backgroundColor: config.color,
            boxShadow: `0 0 20px ${config.color}80`
          }}
        />
      </div>

      {/* Right content area */}
      <div className="hidden md:flex w-[calc(50%-28px)] items-center">
        {!isLeft ? (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full"
          >
            <EventCard event={event} config={config} IconComponent={IconComponent} align="left" onEdit={onEdit} onDelete={onDelete} />
          </motion.div>
        ) : (
          event.personPhoto && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-start w-full"
            >
              <img src={event.personPhoto} alt="" className="w-24 h-24 rounded-full object-cover shadow-lg cursor-pointer hover:scale-110 transition-transform" style={{ border: `3px solid ${config.color}` }} onClick={() => onPhotoClick?.(event.personPhoto)} />
            </motion.div>
          )
        )}
      </div>

      {/* Mobile layout: dot + card all-left */}
      <div className="flex md:hidden items-start gap-4 w-full">
        {/* Mobile dot */}
        <div className="relative z-10 flex-shrink-0 mt-1">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.3 }}
            className="w-4 h-4 rounded-full border-4 shadow-md"
            style={{
              borderColor: config.color,
              backgroundColor: config.color,
              boxShadow: `0 0 15px ${config.color}80`
            }}
          />
        </div>
        {/* Mobile card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1"
        >
          <EventCard event={event} config={config} IconComponent={IconComponent} align="left" />
        </motion.div>
      </div>
    </div>
  );
}

function EventCard({ event, config, IconComponent, align, onEdit, onDelete }) {
  return (
    <div
      className={`rounded-2xl p-5 transition-all relative group ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      style={{
        backgroundColor: '#152238',
        border: '2px solid rgba(184,150,62,0.3)',
        boxShadow: `0 4px 20px ${config.color}20`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 30px ${config.color}50, 0 0 40px ${config.color}15`;
        e.currentTarget.style.borderColor = 'rgba(184,150,62,0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 20px ${config.color}20`;
        e.currentTarget.style.borderColor = 'rgba(184,150,62,0.3)';
      }}
    >
      {/* Edit/Delete buttons (hidden for auto-generated events) */}
      {!event._auto && (
        <div className={`absolute top-2 ${align === 'right' ? 'left-2' : 'right-2'} flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10`}>
          <button onClick={onEdit} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 shadow transition text-white/60">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-red-500/20 shadow text-red-400 hover:text-red-300 transition">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Type badge + year */}
      <div
        className={`flex items-center gap-2 mb-2 ${
          align === 'right' ? 'justify-end' : 'justify-start'
        }`}
      >
        {align === 'right' && (
          <span
            className="text-3xl font-serif font-bold leading-none"
            style={{ color: config.color }}
          >
            {event.year}
          </span>
        )}
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: `${config.color}30`,
            color: config.color,
            border: `1px solid ${config.color}50`
          }}
        >
          <IconComponent size={12} />
          {config.label}
        </span>
        {align === 'left' && (
          <span
            className="text-3xl font-serif font-bold leading-none"
            style={{ color: config.color }}
          >
            {event.year}
          </span>
        )}
        {event._auto && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 font-medium text-white/40">Auto</span>
        )}
      </div>

      {/* Date */}
      {event.date && (
        <p className="text-xs mb-1 tracking-wide uppercase text-white/40">
          {formatDate(event.date)}
        </p>
      )}

      {/* Title */}
      <h3 className="font-sans text-xl font-semibold leading-snug mb-1 text-white tracking-wide">
        {event.title}
      </h3>

      {/* Description */}
      {event.description && (
        <p className="text-sm leading-relaxed text-white/60">
          {event.description}
        </p>
      )}

      {/* Photo */}
      {event.photoURL && (
        <img src={event.photoURL} alt="" className="mt-2 w-full h-24 rounded-lg object-cover" />
      )}
    </div>
  );
}

const inputClass = 'w-full rounded-lg border-4 border-white/80 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6B9080]/30'
const labelClass = 'block text-xs font-medium text-white mb-1'

const eventTypes = [
  { value: 'nacimiento', label: 'Nacimiento' },
  { value: 'boda', label: 'Boda' },
  { value: 'aniversario', label: 'Aniversario' },
  { value: 'reunion', label: 'Reunion' },
  { value: 'memorial', label: 'Memorial' },
]

function EventForm({ isOpen, onClose, eventData, onSave }) {
  const [form, setForm] = useState({
    year: eventData?.year || '',
    date: eventData?.date || '',
    title: eventData?.title || '',
    description: eventData?.description || '',
    type: eventData?.type || 'nacimiento',
    photoFile: null,
    photoPreview: eventData?.photoURL || null,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm({
      year: eventData?.year || '',
      date: eventData?.date || '',
      title: eventData?.title || '',
      description: eventData?.description || '',
      type: eventData?.type || 'nacimiento',
      photoFile: null,
      photoPreview: eventData?.photoURL || null,
    })
  }, [eventData, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let photoURL = eventData?.photoURL || null
      if (form.photoFile) {
        const { uploadPhoto } = await import('../firebase/familyService')
        photoURL = await uploadPhoto(form.photoFile, `timeline/${Date.now()}`)
      }
      await onSave({
        ...form,
        year: parseInt(form.year) || new Date().getFullYear(),
        photoURL,
      })
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
          <input type="text" name="title" value={form.title} onChange={handleChange} className={inputClass} required placeholder="Ej. Nace Roberto" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Año</label>
            <input type="number" name="year" value={form.year} onChange={handleChange} className={inputClass} required placeholder="1990" />
          </div>
          <div>
            <label className={labelClass}>Fecha (texto libre)</label>
            <input type="text" name="date" value={form.date} onChange={handleChange} className={inputClass} placeholder="12 de Junio, 1990" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Tipo de evento</label>
          <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
            {eventTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Descripcion</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={inputClass + ' resize-none'} placeholder="Que paso en este momento..." />
        </div>
        <div>
          <label className={labelClass}>Foto del evento (opcional)</label>
          <input type="file" accept="image/*" onChange={async (e) => {
            const file = e.target.files[0]
            if (!file) return
            setForm(p => ({ ...p, photoFile: file, photoPreview: URL.createObjectURL(file) }))
          }} className="text-sm text-white" />
          {form.photoPreview && <img src={form.photoPreview} alt="Vista previa de la foto del evento" className="mt-2 h-20 rounded-lg object-cover" />}
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

export default function Timeline() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [deletingEvent, setDeletingEvent] = useState(null)
  const [filterType, setFilterType] = useState('todos')

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    const [manual, members, gp] = await Promise.all([getTimelineEvents(), getFamilyMembers(), getGrandparents()])

    const auto = []

    // Grandparents births and wedding
    if (gp) {
      const gf = gp.grandfather
      const gm = gp.grandmother
      if (gf?.birthDate) auto.push({ year: parseInt(gf.birthDate.split('-')[0]), date: gf.birthDate, title: `Nace ${gf.fullName || gf.name}`, description: gf.role || 'Patriarca', type: 'nacimiento', _auto: true, personPhoto: gf.photoURL })
      if (gm?.birthDate) auto.push({ year: parseInt(gm.birthDate.split('-')[0]), date: gm.birthDate, title: `Nace ${gm.fullName || gm.name}`, description: gm.role || 'Matriarca', type: 'nacimiento', _auto: true, personPhoto: gm.photoURL })
      if (gp.weddingDate) auto.push({ year: parseInt(gp.weddingDate.split('-')[0]), date: gp.weddingDate, title: `Boda de ${(gf?.name || 'Abuelo').split(' ')[0]} y ${(gm?.name || 'Abuela').split(' ')[0]}`, description: gp.weddingPlace || '', type: 'boda', _auto: true, personPhoto: gf?.photoURL })
      if (gf?.deathDate) auto.push({ year: parseInt(gf.deathDate.split('-')[0]), date: gf.deathDate, title: `Partida de ${gf.fullName || gf.name}`, description: '', type: 'memorial', _auto: true, personPhoto: gf.photoURL })
      if (gm?.deathDate) auto.push({ year: parseInt(gm.deathDate.split('-')[0]), date: gm.deathDate, title: `Partida de ${gm.fullName || gm.name}`, description: '', type: 'memorial', _auto: true, personPhoto: gm.photoURL })
    }

    // Walk all members recursively
    const walk = (person, depth) => {
      if (person.birthDate) {
        auto.push({ year: parseInt(person.birthDate.split('-')[0]), date: person.birthDate, title: `Nace ${person.name}`, description: '', type: 'nacimiento', _auto: true, personPhoto: person.photoURL || person.photo })
      }
      if (person.deathDate) {
        auto.push({ year: parseInt(person.deathDate.split('-')[0]), date: person.deathDate, title: `Partida de ${person.name}`, description: '', type: 'memorial', _auto: true, personPhoto: person.photoURL || person.photo })
      }
      if (person.weddingDate && person.spouse) {
        const spouseName = typeof person.spouse === 'object' ? person.spouse.name : person.spouse
        auto.push({ year: parseInt(person.weddingDate.split('-')[0]), date: person.weddingDate, title: `Boda de ${person.name?.split(' ')[0]} y ${spouseName?.split(' ')[0]}`, description: person.weddingPlace || '', type: 'boda', _auto: true, personPhoto: person.photoURL || person.photo })
      }
      if (person.spouse && typeof person.spouse === 'object' && person.spouse.birthDate) {
        auto.push({ year: parseInt(person.spouse.birthDate.split('-')[0]), date: person.spouse.birthDate, title: `Nace ${person.spouse.name}`, description: '', type: 'nacimiento', _auto: true, personPhoto: person.spouse.photoURL || person.spouse.photo })
      }
      if (person.children) person.children.forEach(c => walk(c, depth + 1))
    }
    members.forEach(m => walk(m, 0))

    // Merge: manual events take priority. Remove auto events that match manual by similar title
    const normalize = (s) => s?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    const manualTitles = new Set(manual.map(m => normalize(m.title)))
    const uniqueAuto = auto.filter(a => !manualTitles.has(normalize(a.title)))

    // Build a name→photo lookup from all people
    const photoLookup = {}
    if (gp?.grandfather) photoLookup[(gp.grandfather.fullName || gp.grandfather.name || '').toLowerCase()] = gp.grandfather.photoURL
    if (gp?.grandmother) photoLookup[(gp.grandmother.fullName || gp.grandmother.name || '').toLowerCase()] = gp.grandmother.photoURL
    const walkPhotos = (p) => {
      if (p.name) photoLookup[p.name.toLowerCase()] = p.photoURL || p.photo
      if (p.spouse && typeof p.spouse === 'object' && p.spouse.name) photoLookup[p.spouse.name.toLowerCase()] = p.spouse.photoURL || p.spouse.photo
      if (p.children) p.children.forEach(walkPhotos)
    }
    members.forEach(walkPhotos)

    // Enrich manual events: if no personPhoto, try to match by name in title
    const enriched = manual.map(e => {
      if (e.personPhoto) return e
      const titleLower = (e.title || '').toLowerCase()
      for (const [name, photo] of Object.entries(photoLookup)) {
        if (photo && titleLower.includes(name.split(' ')[0].toLowerCase()) && titleLower.includes(name.split(' ').slice(-1)[0].toLowerCase())) {
          return { ...e, personPhoto: photo }
        }
      }
      return e
    })

    const all = [...enriched, ...uniqueAuto].sort((a, b) => (a.year || 0) - (b.year || 0))
    setEvents(all)
    setLoading(false)
  }

  const displayEvents = events
  const filteredEvents = filterType === 'todos' ? displayEvents : displayEvents.filter(e => e.type === filterType)

  const handleSave = async (formData) => {
    const id = editingEvent?.id || null
    await saveTimelineEvent(id, formData)
    sounds.save()
    setEditingEvent(null)
    setShowCreateForm(false)
    await loadEvents()
  }

  const handleDelete = async () => {
    if (deletingEvent?.id) {
      await deleteTimelineEvent(deletingEvent.id)
      sounds.delete()
      setDeletingEvent(null)
      await loadEvents()
    }
  }

  return (
    <section id="timeline" className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="max-w-[1600px] mx-auto">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-sans font-medium uppercase tracking-[5px] mb-4" style={{ color: '#8A8A8A' }}>Nuestra historia</p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold italic mb-5" style={{ color: '#1C1C1C' }}>
            Nuestra Historia
          </h2>
          <div className="w-8 h-[1px] bg-[#B8963E] mx-auto mb-5" />
          <p className="text-base max-w-md mx-auto leading-relaxed text-white/60">
            Los momentos que han marcado nuestra familia a traves del tiempo.
          </p>
        </motion.div>

        {/* Filter buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['todos', 'nacimiento', 'boda', 'memorial', 'reunion', 'aniversario'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filterType === type
                  ? 'text-white shadow-md'
                  : 'bg-black/5 border border-black/10 hover:bg-black/10'
              }`}
              style={filterType === type
                ? { backgroundColor: type === 'todos' ? '#B8963E' : (typeConfig[type]?.color || '#B8963E') }
                : { color: '#4A4A4A' }}
            >
              {type === 'todos' ? 'Todos' : (typeConfig[type]?.label || type)}
            </button>
          ))}
        </div>

        {/* Skeleton while loading */}
        {loading && <SkeletonTimeline count={4} />}

        {/* Timeline container */}
        {!loading && filteredEvents.length > 0 ? (
          <div className="relative">
            {/* Desktop center line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2" style={{ background: 'linear-gradient(to bottom, rgba(184,150,62,0.5), rgba(184,150,62,0.2), transparent)' }} />

            {/* Mobile left line */}
            <div className="md:hidden absolute left-[7px] top-0 bottom-0 w-[2px]" style={{ background: 'linear-gradient(to bottom, rgba(184,150,62,0.5), rgba(184,150,62,0.2), transparent)' }} />

            {/* Events */}
            {filteredEvents.map((event, index) => (
              <TimelineEvent
                key={event.id || index}
                event={event}
                index={index}
                onEdit={() => setEditingEvent(event)}
                onDelete={() => setDeletingEvent(event)}
                onPhotoClick={setLightboxPhoto}
              />
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8" style={{ color: '#8A8A8A' }} />
            </div>
            <p className="text-lg font-serif font-bold mb-2" style={{ color: '#4A4A4A' }}>Sin eventos todavia</p>
            <p className="text-sm mb-6" style={{ color: '#8A8A8A' }}>Agrega el primer evento de tu historia familiar</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#B8963E] text-white hover:bg-[#B8963E]/90 transition font-medium shadow-md"
            >
              <Plus className="w-5 h-5" />
              Agregar primer evento
            </button>
          </div>
        ) : null}

        {/* Add event button */}
        {filteredEvents.length > 0 && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-black/15 hover:bg-black/5 hover:border-black/25 transition font-medium" style={{ color: '#4A4A4A' }}
            >
              <Plus className="w-5 h-5" />
              Agregar evento
            </button>
          </div>
        )}
      </div>

      {/* Event form modals */}
      <EventForm
        isOpen={editingEvent !== null}
        onClose={() => setEditingEvent(null)}
        eventData={editingEvent}
        onSave={handleSave}
      />
      <EventForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        eventData={null}
        onSave={handleSave}
      />

      {/* Delete confirmation */}
      <AnimatePresence>
        {deletingEvent && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingEvent(null)} />
            <motion.div
              className="relative bg-[#1E293B] rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-serif font-bold text-white mb-2">Eliminar evento</h3>
              <p className="text-sm text-white/70 mb-6">
                ¿Eliminar <strong>"{deletingEvent.title}"</strong>?
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeletingEvent(null)} className="px-5 py-2 rounded-lg border-4 border-white/80 text-white hover:bg-white/10 transition text-sm font-medium">
                  Cancelar
                </button>
                <button onClick={handleDelete} className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm font-medium">
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxPhoto(null)}
          >
            <motion.img
              src={lightboxPhoto}
              alt=""
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
