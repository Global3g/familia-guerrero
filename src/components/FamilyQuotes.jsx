import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, Plus, Pencil, Trash2, Save, Loader2, MessageSquareQuote } from 'lucide-react'
import Modal from './Modal'
import { db } from '../firebase/config'
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'

/* ── Firestore helpers ── */
const getQuotes = async () => {
  try {
    const snap = await getDocs(collection(db, 'familyQuotes'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) { return [] }
}
const saveQuote = async (id, data) => {
  const docId = id || doc(collection(db, 'familyQuotes')).id
  await setDoc(doc(db, 'familyQuotes', docId), data, { merge: true })
}
const deleteQuoteDoc = async (id) => { await deleteDoc(doc(db, 'familyQuotes', id)) }

/* ── Animation variants ── */
const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' },
  }),
}

const cardVariant = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.3 } },
}

/* ── Card tint palette ── */
const cardTints = [
  { bg: '#FFFFFF', border: '#E2E8F0', accent: '#0F172A' },
]

const emptyForm = { phrase: '', author: '', authorPhoto: '', context: '' }

export default function FamilyQuotes() {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState(null)
  const [form, setForm] = useState(emptyForm)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  /* ── Load quotes ── */
  const loadQuotes = async () => {
    setLoading(true)
    const data = await getQuotes()
    setQuotes(data)
    setLoading(false)
  }

  useEffect(() => { loadQuotes() }, [])

  /* ── Handlers ── */
  const openAdd = () => {
    setEditingQuote(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (q) => {
    setEditingQuote(q)
    setForm({ phrase: q.phrase || '', author: q.author || '', authorPhoto: q.authorPhoto || '', context: q.context || '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.phrase.trim() || !form.author.trim()) return
    setSaving(true)
    try {
      const data = {
        phrase: form.phrase.trim(),
        author: form.author.trim(),
        authorPhoto: form.authorPhoto.trim(),
        context: form.context.trim(),
        updatedAt: Date.now(),
      }
      await saveQuote(editingQuote?.id || null, data)
      await loadQuotes()
      setModalOpen(false)
    } catch (e) {
      console.error('Error saving quote:', e)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteQuoteDoc(deleteTarget.id)
      await loadQuotes()
      setDeleteTarget(null)
    } catch (e) {
      console.error('Error deleting quote:', e)
    }
    setDeleting(false)
  }

  const onFieldChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  return (
    <section
      id="frases"
      className="relative py-24 overflow-hidden"
      style={{ backgroundColor: '#0F172A' }}
    >
      {/* Background blurs */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white opacity-[0.02] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white opacity-[0.02] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* ── Section Header ── */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          custom={0}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-sans font-medium uppercase tracking-[5px] text-white/40 mb-4">Frases que nos definen</p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-5">
            Frases de la Familia
          </h2>
          <div className="w-8 h-[1px] bg-[#B8654A] mx-auto mb-5" />
          <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
            Las palabras que nos han marcado, las frases que se repiten de generacion en generacion
          </p>
        </motion.div>

        {/* ── Add Button ── */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={1}
          className="flex justify-center mb-12"
        >
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            style={{ backgroundColor: '#B8654A' }}
          >
            <Plus size={20} />
            Agregar frase
          </button>
        </motion.div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#B8654A]" />
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && quotes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Quote className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <p className="text-lg text-white/40">
              Aun no hay frases registradas. Agrega la primera.
            </p>
          </motion.div>
        )}

        {/* ── Quote Cards Grid ── */}
        {!loading && quotes.length > 0 && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-30px' }}
          >
            <AnimatePresence mode="popLayout">
              {quotes.map((q, idx) => {
                const tint = cardTints[idx % cardTints.length]
                return (
                  <motion.div
                    key={q.id}
                    variants={cardVariant}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="group relative rounded-2xl p-6 border-4 border-white/80 bg-white/5 transition-shadow duration-300 hover:shadow-xl cursor-default"
                    style={{
                      borderLeft: '4px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    {/* Big decorative quote mark */}
                    <Quote
                      className="absolute top-4 right-4 w-10 h-10"
                      style={{ color: 'rgba(255,255,255,0.1)' }}
                    />

                    {/* Phrase */}
                    <p
                      className="text-lg sm:text-xl leading-relaxed mb-5 relative z-10"
                      style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: "'Playfair Display', serif",
                        fontStyle: 'italic',
                      }}
                    >
                      &ldquo;{q.phrase}&rdquo;
                    </p>

                    {/* Author row */}
                    <div className="flex items-center gap-3 mb-2">
                      {q.authorPhoto ? (
                        <img
                          src={q.authorPhoto}
                          alt={q.author}
                          className="w-10 h-10 rounded-full object-cover border-2"
                          style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-white/10"
                        >
                          {q.author?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <span
                        className="font-semibold text-sm text-white"
                      >
                        {q.author}
                      </span>
                    </div>

                    {/* Context */}
                    {q.context && (
                      <p className="text-xs text-white/40 italic mt-1 pl-[3.25rem]">
                        {q.context}
                      </p>
                    )}

                    {/* Hover action buttons */}
                    <div className="absolute top-3 left-3 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => openEdit(q)}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 shadow-sm transition-colors"
                        style={{ color: '#B8976A' }}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(q)}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 shadow-sm transition-colors"
                        style={{ color: '#B8654A' }}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingQuote ? 'Editar Frase' : 'Nueva Frase'}
      >
        <div className="space-y-5">
          {/* Phrase */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1">
              Frase *
            </label>
            <textarea
              value={form.phrase}
              onChange={(e) => onFieldChange('phrase', e.target.value)}
              rows={3}
              className="w-full rounded-xl border-4 border-white/80 bg-white px-4 py-3 text-white placeholder-[#C4A882] focus:outline-none focus:ring-2 focus:ring-[#B8654A]/30 focus:border-[#B8654A] transition-all resize-none"
              placeholder="Escribe la frase familiar..."
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1">
              Autor *
            </label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => onFieldChange('author', e.target.value)}
              className="w-full rounded-xl border-4 border-white/80 bg-white px-4 py-3 text-white placeholder-[#C4A882] focus:outline-none focus:ring-2 focus:ring-[#B8654A]/30 focus:border-[#B8654A] transition-all"
              placeholder="Quien decia esta frase?"
            />
          </div>

          {/* Author Photo (optional) */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1">
              Foto del autor <span className="text-xs text-[#8B7355] font-normal">(URL, opcional)</span>
            </label>
            <input
              type="text"
              value={form.authorPhoto}
              onChange={(e) => onFieldChange('authorPhoto', e.target.value)}
              className="w-full rounded-xl border-4 border-white/80 bg-white px-4 py-3 text-white placeholder-[#C4A882] focus:outline-none focus:ring-2 focus:ring-[#B8654A]/30 focus:border-[#B8654A] transition-all"
              placeholder="https://..."
            />
          </div>

          {/* Context */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1">
              Contexto <span className="text-xs text-[#8B7355] font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={form.context}
              onChange={(e) => onFieldChange('context', e.target.value)}
              className="w-full rounded-xl border-4 border-white/80 bg-white px-4 py-3 text-white placeholder-[#C4A882] focus:outline-none focus:ring-2 focus:ring-[#B8654A]/30 focus:border-[#B8654A] transition-all"
              placeholder="Siempre lo decia en la cena..."
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !form.phrase.trim() || !form.author.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            style={{ backgroundColor: '#6B9080' }}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                {editingQuote ? 'Guardar Cambios' : 'Agregar Frase'}
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar Frase"
      >
        <div className="space-y-5">
          <p className="text-white">
            Estas seguro de eliminar esta frase?
          </p>
          {deleteTarget && (
            <div
              className="rounded-xl p-4 border-4 border-white/80"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <p
                className="text-base italic"
                style={{ color: '#FFFFFF', fontFamily: "'Playfair Display', serif" }}
              >
                &ldquo;{deleteTarget.phrase}&rdquo;
              </p>
              <p className="text-sm text-[#B8654A] mt-2 font-semibold">
                &mdash; {deleteTarget.author}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-3 rounded-xl font-semibold border-4 border-white/80 text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50 hover:shadow-lg"
              style={{ backgroundColor: '#B8654A' }}
            >
              {deleting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Eliminar
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
