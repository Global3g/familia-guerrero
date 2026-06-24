import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  Music,
  Camera,
  ChefHat,
  Wine,
  ScrollText,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";

import { db } from "../firebase/config";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import Modal from "./Modal";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: "easeOut" },
  }),
};

const iconMap = {
  utensils: UtensilsCrossed,
  music: Music,
  camera: Camera,
  "chef-hat": ChefHat,
  wine: Wine,
  scroll: ScrollText,
};

const iconOptions = [
  { value: 'utensils', label: 'Comida' },
  { value: 'music', label: 'Musica' },
  { value: 'camera', label: 'Fotografia' },
  { value: 'chef-hat', label: 'Cocina' },
  { value: 'wine', label: 'Brindis' },
  { value: 'scroll', label: 'Escritura' },
]

// Firestore CRUD
const getTraditions = async () => {
  try {
    const snap = await getDocs(collection(db, 'traditions'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) { return [] }
}
const saveTradition = async (id, data) => {
  const docId = id || doc(collection(db, 'traditions')).id
  await setDoc(doc(db, 'traditions', docId), data, { merge: true })
}
const deleteTradition = async (id) => { await deleteDoc(doc(db, 'traditions', id)) }

const emptyForm = { author: '', description: '', icon: 'utensils' }

export default function Traditions() {
  const [traditions, setTraditions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal state
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchTraditions()
  }, [])

  const fetchTraditions = async () => {
    setLoading(true)
    try {
      const list = await getTraditions()
      setTraditions(list)
    } catch (err) {
      console.error('Error fetching traditions:', err)
    } finally {
      setLoading(false)
    }
  }

  // ---------- Save (create / update) ----------
  const handleSave = async () => {
    if (!form.author.trim() || !form.description.trim()) return
    setSaving(true)
    try {
      await saveTradition(editingId, {
        author: form.author.trim(),
        description: form.description.trim(),
        icon: form.icon,
      })
      await fetchTraditions()
      closeForm()
    } catch (err) {
      console.error('Error saving tradition:', err)
    } finally {
      setSaving(false)
    }
  }

  // ---------- Delete ----------
  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteTradition(deleteTarget.id)
      await fetchTraditions()
      setDeleteOpen(false)
      setDeleteTarget(null)
    } catch (err) {
      console.error('Error deleting tradition:', err)
    } finally {
      setSaving(false)
    }
  }

  // ---------- Helpers ----------
  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (trad) => {
    setEditingId(trad.id)
    setForm({
      author: trad.author || trad.submittedBy || '',
      description: trad.description || trad.title || '',
      icon: trad.icon || 'utensils',
    })
    setFormOpen(true)
  }

  const openDelete = (trad) => {
    setDeleteTarget(trad)
    setDeleteOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  return (
    <section
      id="tradiciones"
      className="relative py-24 overflow-hidden"
      style={{ backgroundColor: '#F5F0E8' }}
    >
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-[#6B9080] opacity-[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#B8963E] opacity-[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-[#B8976A] opacity-[0.03] blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6">
        {/* Section header */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          custom={0}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-sans font-medium uppercase tracking-[5px] mb-4" style={{ color: '#8A8A8A' }}>Nuestras raices</p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold italic mb-5" style={{ color: '#1C1C1C' }}>
            Tradiciones
          </h2>
          <div className="w-8 h-[1px] bg-[#B8963E] mx-auto mb-5" />
          <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: '#4A4A4A' }}>
            Las costumbres que nos unen y nos definen como familia.
          </p>
        </motion.div>

        {/* Add button */}
        <div className="flex justify-center mb-10">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold shadow-lg transition-colors"
            style={{ backgroundColor: '#B8963E' }}
          >
            <Plus className="w-5 h-5" />
            Agregar tradicion
          </motion.button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#B8963E] animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && traditions.length === 0 && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            custom={0.2}
            className="max-w-md mx-auto"
          >
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-[#B8963E]/10 flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="w-8 h-8 text-[#B8963E]/50" />
              </div>
              <p className="text-lg font-serif font-bold mb-2" style={{ color: '#4A4A4A' }}>Sin tradiciones todavia</p>
              <p className="text-sm" style={{ color: '#8A8A8A' }}>Registra las tradiciones que hacen unica a tu familia</p>
            </div>
          </motion.div>
        )}

        {/* Traditions grid */}
        {!loading && traditions.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {traditions.map((tradition, index) => {
                const IconComponent = iconMap[tradition.icon] || Sparkles;
                const author = tradition.author || tradition.submittedBy;
                return (
                  <motion.article
                    key={tradition.id}
                    layout
                    variants={fadeIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-30px" }}
                    custom={index * 0.08}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative rounded-2xl p-6 hover:shadow-lg transition-all duration-500"
                    style={{ backgroundColor: '#FFFDF7', border: '2px solid rgba(184,150,62,0.3)' }}
                  >
                    {/* Edit/Delete */}
                    <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                      <button
                        onClick={() => openEdit(tradition)}
                        className="p-1.5 rounded-full hover:bg-[#B8976A]/15 text-[#B8976A] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDelete(tradition)}
                        className="p-1.5 rounded-full hover:bg-red-100 text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B9080]/15 to-[#B8976A]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-6 h-6" style={{ color: '#B8963E' }} />
                    </div>
                    <h3 className="font-serif text-xl font-bold mb-2" style={{ color: '#1C1C1C' }}>
                      {tradition.description || tradition.title}
                    </h3>
                    {author && (
                      <p className="font-sans text-sm text-[#B8976A] mt-3 font-medium">— {author}</p>
                    )}
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ---------- Form Modal ---------- */}
      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editingId ? 'Editar tradicion' : 'Nueva tradicion'}
      >
        <div className="space-y-5">
          {/* Author */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1">Autor</label>
            <input
              type="text"
              placeholder="Quien comparte esta tradicion"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="w-full rounded-xl border-4 border-white/80 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#B8963E]/40"
            />
          </div>

          {/* Tradition */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1">Tradicion</label>
            <textarea
              rows={4}
              placeholder="Describe la tradicion familiar..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border-4 border-white/80 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#B8963E]/40 resize-none"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1">Icono</label>
            <select
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="w-full rounded-xl border-4 border-white/80 bg-white/5 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#B8963E]/40"
            >
              {iconOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !form.author.trim() || !form.description.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-opacity disabled:opacity-40"
            style={{ backgroundColor: '#6B9080' }}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {editingId ? 'Guardar cambios' : 'Publicar tradicion'}
          </button>
        </div>
      </Modal>

      {/* ---------- Delete Confirmation Modal ---------- */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null) }}
        title="Eliminar tradicion"
      >
        <div className="space-y-5">
          <p className="text-white/50">
            Estas seguro de eliminar la tradicion de{' '}
            <span className="font-bold text-white">{deleteTarget?.author || deleteTarget?.submittedBy}</span>? Esta
            accion no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setDeleteOpen(false); setDeleteTarget(null) }}
              className="flex-1 py-2.5 rounded-xl border-4 border-white/80 text-white font-semibold hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
