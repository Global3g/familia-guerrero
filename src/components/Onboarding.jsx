import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Users, Camera, Heart, MapPin } from 'lucide-react'
import { getFamilyMembers } from '../firebase/familyService'

const STORAGE_KEY = 'familia-guerrero-onboarding-dismissed'

const steps = [
  { icon: Users, label: 'Agrega a los hijos de los abuelos', color: '#7A9E7E' },
  { icon: Camera, label: 'Sube fotos de cada familiar', color: '#C4704B' },
  { icon: Heart, label: 'Agrega esposos y datos de boda', color: '#B8943E' },
  { icon: MapPin, label: 'Completa las ubicaciones', color: '#5D4037' },
]

export default function Onboarding() {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') return

    getFamilyMembers()
      .then((members) => {
        if (members.length < 3) setVisible(true)
      })
      .catch(() => {})
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  function handleShare() {
    const url = `${window.location.origin}/formulario.html`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
          className="relative rounded-2xl border p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(122,158,126,0.10) 0%, rgba(196,112,75,0.10) 100%)',
            borderColor: 'rgba(122,158,126,0.25)',
          }}
        >
          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 rounded-full p-1 transition-colors hover:bg-black/10"
            aria-label="Cerrar"
          >
            <X size={18} style={{ color: '#5D4037' }} />
          </button>

          {/* Title */}
          <h3
            className="mb-4 text-lg font-bold"
            style={{ color: '#5D4037' }}
          >
            Bienvenido! Empieza a construir tu arbol familiar
          </h3>

          {/* Steps */}
          <div className="flex flex-wrap gap-3 mb-4">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: `${step.color}18`,
                    border: `1px solid ${step.color}40`,
                    color: step.color,
                  }}
                >
                  <Icon size={16} />
                  <span>{step.label}</span>
                  {i < steps.length - 1 && (
                    <ArrowRight size={14} className="ml-1 opacity-50" />
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ backgroundColor: '#7A9E7E' }}
          >
            {copied ? 'Enlace copiado!' : 'Compartir formulario'}
            {!copied && <ArrowRight size={14} />}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
