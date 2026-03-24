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
  X,
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

const inputClass = 'w-full rounded-lg border border-[#7A9E7E]/20 bg-white px-3 py-2 text-sm text-[#5D4037] focus:outline-none focus:ring-2 focus:ring-[#7A9E7E]/30'
const labelClass = 'block text-xs font-medium text-[#5D4037] mb-1'

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

const getValues = async () => {
  try {
    const snap = await getDocs(collection(db, 'familyValues'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) { return [] }
}
const saveValue = async (id, data) => {
  const docId = id || doc(collection(db, 'familyValues')).id
  await setDoc(doc(db, 'familyValues', docId), data, { merge: true })
}
const deleteValue = async (id) => { await deleteDoc(doc(db, 'familyValues', id)) }

export default function Traditions() {
  const [traditions, setTraditions] = useState([])
  const [values, setValues] = useState([])
  const [editingTrad, setEditingTrad] = useState(null)
  const [showTradForm, setShowTradForm] = useState(false)
  const [deletingTrad, setDeletingTrad] = useState(null)
  const [newValue, setNewValue] = useState('')

  // Tradition form state
  const [tradForm, setTradForm] = useState({ title: '', description: '', icon: 'utensils' })
  const [tradLoading, setTradLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [t, v] = await Promise.all([getTraditions(), getValues()])
    if (t.length > 0) setTraditions(t)
    if (v.length > 0) setValues(v)
  }

  const displayTraditions = traditions
  const displayValues = values

  const openTradForm = (trad = null) => {
    setTradForm(trad ? { title: trad.title, description: trad.description, icon: trad.icon || 'utensils' } : { title: '', description: '', icon: 'utensils' })
    setEditingTrad(trad)
    setShowTradForm(true)
  }

  const handleSaveTrad = async () => {
    setTradLoading(true)
    try {
      await saveTradition(editingTrad?.id || null, tradForm)
      setShowTradForm(false)
      setEditingTrad(null)
      await loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setTradLoading(false)
    }
  }

  const handleDeleteTrad = async () => {
    if (deletingTrad?.id && !deletingTrad.id.startsWith('default')) {
      await deleteTradition(deletingTrad.id)
      await loadData()
    }
    setDeletingTrad(null)
  }

  const handleAddValue = async () => {
    if (!newValue.trim()) return
    await saveValue(null, { value: newValue.trim() })
    setNewValue('')
    await loadData()
  }

  const handleDeleteValue = async (v) => {
    if (v.id && !v.id.startsWith('default')) {
      await deleteValue(v.id)
      await loadData()
    }
  }

  return (
    <section
      id="tradiciones"
      className="relative py-24 overflow-hidden"
      style={{ backgroundColor: "#FFFDF7" }}
    >
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-[#7A9E7E] opacity-[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#C4704B] opacity-[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-[#B8943E] opacity-[0.03] blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          custom={0}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-[#B8943E]" />
            <span className="font-sans text-sm tracking-widest uppercase text-[#7A9E7E]">
              Lo que nos define
            </span>
            <Sparkles className="w-5 h-5 text-[#B8943E]" />
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-[#5D4037] leading-tight">
            Tradiciones y Valores
          </h2>
          <p className="font-sans mt-4 text-lg text-[#5D4037]/60 max-w-xl mx-auto">
            Las costumbres que nos unen y los principios que nos gu&iacute;an.
          </p>
        </motion.div>

        {/* Traditions grid */}
        {displayTraditions.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            {displayTraditions.map((tradition, index) => {
              const IconComponent = iconMap[tradition.icon] || Sparkles;
              return (
                <motion.article
                  key={tradition.id || tradition.title}
                  variants={fadeIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  custom={index * 0.15 + 0.2}
                  className="group relative bg-white/60 backdrop-blur-sm rounded-2xl border border-[#7A9E7E]/15 p-6 hover:shadow-lg hover:shadow-[#7A9E7E]/10 hover:border-[#7A9E7E]/25 transition-all duration-500"
                >
                  {/* Edit/Delete */}
                  <div className="absolute top-3 right-3 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => openTradForm(tradition)} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 hover:bg-[#B8943E]/10 shadow text-[#B8943E] transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeletingTrad(tradition)} className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 hover:bg-red-50 shadow text-red-400 hover:text-red-600 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-[#7A9E7E]/15 to-[#B8943E]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-6 h-6 text-[#C4704B]" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#5D4037] mb-2">{tradition.title}</h3>
                  <p className="font-sans text-sm text-[#5D4037]/70 leading-relaxed">{tradition.description}</p>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 mb-10">
            <div className="w-16 h-16 rounded-full bg-[#C4704B]/10 flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-8 h-8 text-[#C4704B]/50" />
            </div>
            <p className="text-lg font-serif font-bold text-[#5D4037]/60 mb-2">Sin tradiciones todavia</p>
            <p className="text-sm text-[#5D4037]/40 mb-6">Registra las tradiciones que hacen unica a tu familia</p>
            <button
              onClick={() => openTradForm()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C4704B] text-white hover:bg-[#C4704B]/90 transition font-medium shadow-md"
            >
              <Plus className="w-5 h-5" />
              Agregar primera tradicion
            </button>
          </div>
        )}

        {/* Add tradition button */}
        {displayTraditions.length > 0 && (
          <div className="flex justify-center mb-20">
            <button onClick={() => openTradForm()} className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-[#7A9E7E]/40 text-[#7A9E7E] hover:bg-[#7A9E7E]/5 hover:border-[#7A9E7E] transition font-medium">
              <Plus className="w-5 h-5" /> Agregar tradicion
            </button>
          </div>
        )}

        {/* Values section */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          custom={0}
          className="text-center"
        >
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#5D4037] mb-8">
            Nuestros Valores
          </h3>

          {displayValues.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mb-6">
              {displayValues.map((v, index) => {
                const val = typeof v === 'string' ? v : v.value
                return (
                  <motion.span
                    key={v.id || val}
                    variants={fadeIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    custom={index * 0.1 + 0.1}
                    className="group/val inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 border border-[#B8943E]/20 font-sans text-sm font-medium text-[#5D4037]/80 hover:bg-[#B8943E]/10 hover:border-[#B8943E]/30 transition-colors duration-300 backdrop-blur-sm shadow-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: index % 3 === 0 ? "#7A9E7E" : index % 3 === 1 ? "#C4704B" : "#B8943E" }} />
                    {val}
                    <button onClick={() => handleDeleteValue(v)} className="opacity-0 group-hover/val:opacity-100 transition ml-1 text-red-400 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )
              })}
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-sm text-[#5D4037]/40 mb-2">Agrega los valores que definen a tu familia</p>
            </div>
          )}

          {/* Add value */}
          <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
              placeholder="Nuevo valor..."
              className="flex-1 px-4 py-2 rounded-full border-2 border-[#B8943E]/20 bg-white text-sm text-[#5D4037] focus:outline-none focus:border-[#B8943E]/50"
            />
            <button onClick={handleAddValue} className="w-10 h-10 rounded-full bg-[#B8943E] text-white flex items-center justify-center hover:bg-[#B8943E]/90 transition shadow">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Tradition Form Modal */}
      <Modal isOpen={showTradForm} onClose={() => setShowTradForm(false)} title={editingTrad ? 'Editar Tradicion' : 'Nueva Tradicion'}>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Titulo</label>
            <input type="text" value={tradForm.title} onChange={(e) => setTradForm(p => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="Nombre de la tradicion" />
          </div>
          <div>
            <label className={labelClass}>Descripcion</label>
            <textarea value={tradForm.description} onChange={(e) => setTradForm(p => ({ ...p, description: e.target.value }))} rows={3} className={inputClass + ' resize-none'} placeholder="Describe esta tradicion..." />
          </div>
          <div>
            <label className={labelClass}>Icono</label>
            <select value={tradForm.icon} onChange={(e) => setTradForm(p => ({ ...p, icon: e.target.value }))} className={inputClass}>
              {iconOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleSaveTrad} disabled={tradLoading} className="flex items-center gap-2 rounded-lg bg-[#7A9E7E] px-6 py-2.5 text-white hover:bg-[#7A9E7E]/90 transition disabled:opacity-60">
              {tradLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {tradLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deletingTrad && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingTrad(null)} />
            <motion.div className="relative bg-[#FFF8F0] rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3 className="text-lg font-serif font-bold text-[#5D4037] mb-2">Eliminar tradicion</h3>
              <p className="text-sm text-[#5D4037]/70 mb-6">¿Eliminar <strong>"{deletingTrad.title}"</strong>?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeletingTrad(null)} className="px-5 py-2 rounded-lg border border-[#C4704B]/20 text-[#5D4037] hover:bg-[#FAF6EE] transition text-sm font-medium">Cancelar</button>
                <button onClick={handleDeleteTrad} className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm font-medium">Eliminar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
