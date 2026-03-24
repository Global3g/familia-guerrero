import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

const steps = [
  { title: 'Bienvenido!', text: 'Este es tu centro familiar. Aqui puedes ver y editar toda la informacion de tu familia.', position: 'center' },
  { title: 'Navegacion', text: 'Usa estos tabs para navegar entre secciones: Arbol, Historia, Galeria y mas.', position: 'top' },
  { title: 'Arbol Familiar', text: 'Haz clic en cualquier tarjeta para ver los detalles de cada familia.', position: 'center' },
  { title: 'Chat Familiar', text: 'El boton de chat te permite hablar con tu familia en tiempo real.', position: 'bottom-right' },
  { title: 'Modo Presentacion', text: 'Usa el Modo Presentacion para mostrar tu familia en reuniones.', position: 'center' },
]

export default function CoachMarks() {
  const [step, setStep] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('familia-guerrero-tour-done')) return
    const timer = setTimeout(() => setShow(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  const finish = () => {
    setShow(false)
    localStorage.setItem('familia-guerrero-tour-done', 'true')
  }

  if (!show) return null

  const current = steps[step]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/60" />
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center"
        >
          <button onClick={finish} className="absolute top-3 right-3 text-[#5D4037]/30 hover:text-[#5D4037]/60">
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-full bg-[#C4704B]/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-[#C4704B]">{step + 1}</span>
          </div>

          <h3 className="text-lg font-serif font-bold text-[#5D4037] mb-2">{current.title}</h3>
          <p className="text-sm text-[#5D4037]/70 leading-relaxed mb-6">{current.text}</p>

          <div className="flex items-center justify-between">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : finish()}
              className="flex items-center gap-1 text-sm text-[#5D4037]/50 hover:text-[#5D4037]"
            >
              {step > 0 ? <><ChevronLeft className="w-4 h-4" /> Anterior</> : 'Saltar'}
            </button>
            <span className="text-xs text-[#5D4037]/30">{step + 1} / {steps.length}</span>
            <button
              onClick={() => step < steps.length - 1 ? setStep(step + 1) : finish()}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#C4704B] text-white text-sm font-medium hover:bg-[#C4704B]/90 transition"
            >
              {step < steps.length - 1 ? <>Siguiente <ChevronRight className="w-4 h-4" /></> : 'Comenzar!'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
