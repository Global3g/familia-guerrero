import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Baby, Star, Users, Award, Calendar, Plus, Pencil, Trash2, Save, Loader2, X } from 'lucide-react';
import { timelineEvents as defaultEvents } from '../data/familyData';
import { getTimelineEvents, saveTimelineEvent, deleteTimelineEvent } from '../firebase/familyService';
import Modal from './Modal';

const typeConfig = {
  nacimiento: {
    color: '#7A9E7E',
    bgLight: 'rgba(122, 158, 126, 0.12)',
    border: 'rgba(122, 158, 126, 0.4)',
    icon: Baby,
    label: 'Nacimiento',
  },
  boda: {
    color: '#C4704B',
    bgLight: 'rgba(196, 112, 75, 0.12)',
    border: 'rgba(196, 112, 75, 0.4)',
    icon: Heart,
    label: 'Boda',
  },
  memorial: {
    color: '#B8943E',
    bgLight: 'rgba(184, 148, 62, 0.12)',
    border: 'rgba(184, 148, 62, 0.4)',
    icon: Star,
    label: 'Memorial',
  },
  reunion: {
    color: '#2C3E50',
    bgLight: 'rgba(44, 62, 80, 0.10)',
    border: 'rgba(44, 62, 80, 0.35)',
    icon: Users,
    label: 'Reunion',
  },
  aniversario: {
    color: '#E8956D',
    bgLight: 'rgba(232, 149, 109, 0.12)',
    border: 'rgba(232, 149, 109, 0.4)',
    icon: Award,
    label: 'Aniversario',
  },
};

const defaultConfig = {
  color: '#5D4037',
  bgLight: 'rgba(93, 64, 55, 0.08)',
  border: 'rgba(93, 64, 55, 0.3)',
  icon: Calendar,
  label: 'Evento',
};

function TimelineEvent({ event, index, onEdit, onDelete }) {
  const isLeft = index % 2 === 0;
  const config = typeConfig[event.type] || defaultConfig;
  const IconComponent = config.icon;

  return (
    <div className="relative flex items-start md:items-center w-full mb-12 last:mb-0">
      {/* Desktop: alternating layout */}
      {/* Left content area */}
      <div
        className={`hidden md:block w-[calc(50%-28px)] ${
          isLeft ? '' : 'order-3'
        }`}
      >
        {isLeft && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <EventCard event={event} config={config} IconComponent={IconComponent} align="right" onEdit={onEdit} onDelete={onDelete} />
          </motion.div>
        )}
      </div>

      {/* Center dot */}
      <div className="hidden md:flex w-14 justify-center order-2 relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="w-5 h-5 rounded-full border-[3px] shadow-md"
          style={{
            borderColor: config.color,
            backgroundColor: config.bgLight,
          }}
        />
      </div>

      {/* Right content area */}
      <div
        className={`hidden md:block w-[calc(50%-28px)] ${
          isLeft ? 'order-3' : ''
        }`}
      >
        {!isLeft && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <EventCard event={event} config={config} IconComponent={IconComponent} align="left" onEdit={onEdit} onDelete={onDelete} />
          </motion.div>
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
            className="w-4 h-4 rounded-full border-[3px] shadow-md"
            style={{
              borderColor: config.color,
              backgroundColor: config.bgLight,
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
      className={`rounded-2xl shadow-lg p-5 border transition-shadow hover:shadow-xl relative group ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      style={{
        backgroundColor: config.bgLight,
        borderColor: config.border,
      }}
    >
      {/* Edit/Delete buttons */}
      <div className={`absolute top-2 ${align === 'right' ? 'left-2' : 'right-2'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
        <button onClick={onEdit} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 hover:bg-[#B8943E]/10 shadow text-[#B8943E] transition">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 hover:bg-red-50 shadow text-red-400 hover:text-red-600 transition">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

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
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: config.color }}
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
      </div>

      {/* Date */}
      {event.date && (
        <p className="text-xs text-[#5D4037]/50 mb-1 tracking-wide uppercase">
          {event.date}
        </p>
      )}

      {/* Title */}
      <h3 className="font-serif text-lg font-bold text-[#5D4037] leading-snug mb-1">
        {event.title}
      </h3>

      {/* Description */}
      {event.description && (
        <p className="text-sm text-[#5D4037]/75 leading-relaxed">
          {event.description}
        </p>
      )}
    </div>
  );
}

const inputClass = 'w-full rounded-lg border border-[#7A9E7E]/20 bg-white px-3 py-2 text-sm text-[#5D4037] focus:outline-none focus:ring-2 focus:ring-[#7A9E7E]/30'
const labelClass = 'block text-xs font-medium text-[#5D4037] mb-1'

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
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm({
      year: eventData?.year || '',
      date: eventData?.date || '',
      title: eventData?.title || '',
      description: eventData?.description || '',
      type: eventData?.type || 'nacimiento',
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
      await onSave({
        ...form,
        year: parseInt(form.year) || new Date().getFullYear(),
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

export default function Timeline() {
  const [events, setEvents] = useState([])
  const [editingEvent, setEditingEvent] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    const data = await getTimelineEvents()
    if (data.length > 0) {
      setEvents(data.sort((a, b) => (a.year || 0) - (b.year || 0)))
    }
  }

  const displayEvents = events.length > 0 ? events : defaultEvents

  const handleSave = async (formData) => {
    const id = editingEvent?.id || null
    await saveTimelineEvent(id, formData)
    setEditingEvent(null)
    setShowCreateForm(false)
    await loadEvents()
  }

  const handleDelete = async () => {
    if (deletingEvent?.id) {
      await deleteTimelineEvent(deletingEvent.id)
      setDeletingEvent(null)
      await loadEvents()
    }
  }

  return (
    <section id="timeline" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFFDF7]">
      <div className="max-w-5xl mx-auto">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar size={28} className="text-[#C4704B]" />
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#5D4037] tracking-tight">
            Nuestra Historia
          </h2>
          <div className="mt-4 mx-auto w-24 h-1 rounded-full bg-gradient-to-r from-[#7A9E7E] to-[#C4704B]" />
        </motion.div>

        {/* Timeline container */}
        <div className="relative">
          {/* Desktop center line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#C4704B]/30 via-[#7A9E7E]/30 to-[#5D4037]/10 -translate-x-1/2" />

          {/* Mobile left line */}
          <div className="md:hidden absolute left-[7px] top-0 bottom-0 w-px bg-gradient-to-b from-[#C4704B]/30 via-[#7A9E7E]/30 to-[#5D4037]/10" />

          {/* Events */}
          {displayEvents.map((event, index) => (
            <TimelineEvent
              key={event.id || index}
              event={event}
              index={index}
              onEdit={() => setEditingEvent(event)}
              onDelete={() => setDeletingEvent(event)}
            />
          ))}
        </div>

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
              className="relative bg-[#FFF8F0] rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-serif font-bold text-[#5D4037] mb-2">Eliminar evento</h3>
              <p className="text-sm text-[#5D4037]/70 mb-6">
                ¿Eliminar <strong>"{deletingEvent.title}"</strong>?
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeletingEvent(null)} className="px-5 py-2 rounded-lg border border-[#C4704B]/20 text-[#5D4037] hover:bg-[#FAF6EE] transition text-sm font-medium">
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
    </section>
  );
}
