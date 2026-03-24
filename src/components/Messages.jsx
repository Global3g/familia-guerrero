import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Plus, Pencil, Trash2, Save, Loader2, User } from 'lucide-react'
import Modal from './Modal'
import { db } from '../firebase/config'
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: 'easeOut' },
  }),
}

const COLLECTION = 'familyMessages'

const emptyForm = { author: '', message: '', date: '', photoURL: '' }

export default function Messages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal state
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)

  // ---------- Fetch ----------
  const fetchMessages = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, COLLECTION))
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setMessages(list)
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  // ---------- Save (create / update) ----------
  const handleSave = async () => {
    if (!form.author.trim() || !form.message.trim()) return
    setSaving(true)
    try {
      const id = editingId || doc(collection(db, COLLECTION)).id
      await setDoc(doc(db, COLLECTION, id), {
        author: form.author.trim(),
        message: form.message.trim(),
        date: form.date || new Date().toISOString().slice(0, 10),
        ...(form.photoURL?.trim() ? { photoURL: form.photoURL.trim() } : {}),
      })
      await fetchMessages()
      closeForm()
    } catch (err) {
      console.error('Error saving message:', err)
    } finally {
      setSaving(false)
    }
  }

  // ---------- Delete ----------
  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteDoc(doc(db, COLLECTION, deleteTarget.id))
      await fetchMessages()
      setDeleteOpen(false)
      setDeleteTarget(null)
    } catch (err) {
      console.error('Error deleting message:', err)
    } finally {
      setSaving(false)
    }
  }

  // ---------- Helpers ----------
  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) })
    setFormOpen(true)
  }

  const openEdit = (msg) => {
    setEditingId(msg.id)
    setForm({
      author: msg.author || '',
      message: msg.message || '',
      date: msg.date || '',
      photoURL: msg.photoURL || '',
    })
    setFormOpen(true)
  }

  const openDelete = (msg) => {
    setDeleteTarget(msg)
    setDeleteOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const [y, m, d] = dateStr.split('-')
      const date = new Date(Number(y), Number(m) - 1, Number(d))
      return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // ---------- Render ----------
  return (
    <section
      id="mensajes"
      className="relative py-24 overflow-hidden"
      style={{ backgroundColor: '#FFFDF7' }}
    >
      {/* Background warmth */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#C4704B] opacity-[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#B8943E] opacity-[0.04] blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          custom={0}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <MessageCircle className="w-5 h-5 text-[#C4704B]" />
            <span className="font-sans text-sm tracking-widest uppercase text-[#C4704B]/70">
              Recuerdos compartidos
            </span>
            <MessageCircle className="w-5 h-5 text-[#C4704B]" />
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-[#5D4037] leading-tight">
            Voces de la Familia
          </h2>
          <p className="font-sans mt-4 text-lg text-[#5D4037]/60 max-w-xl mx-auto">
            Palabras que nacen del coraz&oacute;n y se quedan para siempre.
          </p>
        </motion.div>

        {/* Add button */}
        <div className="flex justify-center mb-10">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold shadow-lg transition-colors"
            style={{ backgroundColor: '#C4704B' }}
          >
            <Plus className="w-5 h-5" />
            Agregar mensaje
          </motion.button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#C4704B] animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            custom={0.2}
            className="max-w-md mx-auto"
          >
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-[#C4704B]/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-[#C4704B]/50" />
              </div>
              <p className="text-lg font-serif font-bold text-[#5D4037]/60 mb-2">
                Sin mensajes aun
              </p>
              <p className="text-sm text-[#5D4037]/40">
                Comparte un recuerdo o mensaje para la familia.
              </p>
            </div>
          </motion.div>
        )}

        {/* Messages grid */}
        {!loading && messages.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  layout
                  variants={fadeIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-30px' }}
                  custom={i * 0.08}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: '#FFF8F0', border: '1px solid #F0E0D0' }}
                >
                  {/* Edit / Delete buttons */}
                  <div className="absolute top-3 right-3 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(msg)}
                      className="p-1.5 rounded-full hover:bg-[#B8943E]/15 text-[#B8943E] transition-colors"
                      aria-label="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDelete(msg)}
                      className="p-1.5 rounded-full hover:bg-red-100 text-red-400 transition-colors"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Avatar + author */}
                  <div className="flex items-center gap-3 mb-4">
                    {msg.photoURL ? (
                      <img
                        src={msg.photoURL}
                        alt={msg.author}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-[#C4704B]/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-[#7A9E7E]">
                        {(msg.author || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-serif font-bold text-[#5D4037] leading-tight">
                        {msg.author}
                      </p>
                      <p className="text-xs text-[#5D4037]/45">{formatDate(msg.date)}</p>
                    </div>
                  </div>

                  {/* Message */}
                  <p className="font-serif italic text-[#5D4037]/80 leading-relaxed">
                    &ldquo;{msg.message}&rdquo;
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ---------- Form Modal ---------- */}
      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editingId ? 'Editar mensaje' : 'Nuevo mensaje'}
      >
        <div className="space-y-5">
          {/* Author */}
          <div>
            <label className="block text-sm font-semibold text-[#5D4037] mb-1">Autor</label>
            <input
              type="text"
              placeholder="Nombre del familiar"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="w-full rounded-xl border border-[#E8D5C4] bg-white px-4 py-2.5 text-[#5D4037] placeholder:text-[#5D4037]/30 focus:outline-none focus:ring-2 focus:ring-[#C4704B]/40"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-[#5D4037] mb-1">Mensaje</label>
            <textarea
              rows={4}
              placeholder="Escribe un recuerdo o mensaje..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-xl border border-[#E8D5C4] bg-white px-4 py-2.5 text-[#5D4037] placeholder:text-[#5D4037]/30 focus:outline-none focus:ring-2 focus:ring-[#C4704B]/40 resize-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-[#5D4037] mb-1">Fecha</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-xl border border-[#E8D5C4] bg-white px-4 py-2.5 text-[#5D4037] focus:outline-none focus:ring-2 focus:ring-[#C4704B]/40"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !form.author.trim() || !form.message.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-opacity disabled:opacity-40"
            style={{ backgroundColor: '#7A9E7E' }}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {editingId ? 'Guardar cambios' : 'Publicar mensaje'}
          </button>
        </div>
      </Modal>

      {/* ---------- Delete Confirmation Modal ---------- */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setDeleteTarget(null)
        }}
        title="Eliminar mensaje"
      >
        <div className="space-y-5">
          <p className="text-[#5D4037]/70">
            Estas seguro de eliminar el mensaje de{' '}
            <span className="font-bold text-[#5D4037]">{deleteTarget?.author}</span>? Esta
            accion no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setDeleteOpen(false)
                setDeleteTarget(null)
              }}
              className="flex-1 py-2.5 rounded-xl border border-[#E8D5C4] text-[#5D4037] font-semibold hover:bg-[#F0E0D0]/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
