import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Heart, PartyPopper, Calendar, X } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_FULL = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function WeeklyBanner() {
  const [events, setEvents] = useState([])
  const [lightboxPhoto, setLightboxPhoto] = useState(null)

  useEffect(() => {
    async function load() {
      const [members, gp] = await Promise.all([getFamilyMembers(), getGrandparents()])
      const today = new Date()
      const thisYear = today.getFullYear()
      const allEvents = []

      const addDate = (person, dateField, type) => {
        if (!person[dateField]) return
        const parts = person[dateField].split('-').map(Number)
        if (parts.length < 3) return
        const [yr, m, d] = parts
        let eventDate = new Date(thisYear, m - 1, d)
        if (eventDate < today) eventDate = new Date(thisYear + 1, m - 1, d)
        const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24))
        allEvents.push({
          name: person.name?.split(' ')[0] || person.fullName?.split(' ')[0] || '?',
          fullName: person.fullName || person.name || '',
          photoURL: person.photoURL || null,
          type,
          day: d,
          month: m,
          diffDays,
        })
      }

      const walk = (p) => {
        addDate(p, 'birthDate', 'birthday')
        addDate(p, 'weddingDate', 'anniversary')
        if (p.spouse && typeof p.spouse === 'object') addDate(p.spouse, 'birthDate', 'birthday')
        ;(p.children || []).forEach(walk)
      }

      if (gp?.grandfather) addDate(gp.grandfather, 'birthDate', 'birthday')
      if (gp?.grandmother) addDate(gp.grandmother, 'birthDate', 'birthday')
      if (gp?.weddingDate) {
        const parts = gp.weddingDate.split('-').map(Number)
        if (parts.length >= 3) {
          const [yr, m, d] = parts
          let eventDate = new Date(thisYear, m - 1, d)
          if (eventDate < today) eventDate = new Date(thisYear + 1, m - 1, d)
          const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24))
          allEvents.push({ name: 'Abuelos', fullName: 'Aniversario Abuelos', photoURL: gp.grandfather?.photoURL, type: 'anniversary', day: d, month: m, diffDays })
        }
      }
      members.forEach(walk)

      allEvents.sort((a, b) => a.diffDays - b.diffDays)
      setEvents(allEvents.slice(0, 8))
    }
    load()
  }, [])

  if (events.length === 0) return null

  const formatDiff = (days) => {
    if (days === 0) return 'Hoy!'
    if (days === 1) return 'Manana'
    if (days <= 7) return `${days} dias`
    if (days <= 30) return `${Math.ceil(days / 7)} sem`
    return `${Math.ceil(days / 30)} mes${Math.ceil(days / 30) > 1 ? 'es' : ''}`
  }

  const getColors = (e) => {
    if (e.diffDays === 0) return { bg: '#B8654A', text: 'white', accent: '#BFDBFE' }
    if (e.diffDays <= 7) return { bg: '#EFF6FF', text: '#B8654A', accent: '#B8654A' }
    if (e.type === 'anniversary') return { bg: '#F8FAFC', text: '#B8976A', accent: '#B8976A' }
    return { bg: '#F1F5F9', text: '#0F172A', accent: '#6B9080' }
  }

  const initials = (name) => (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <section className="py-16" style={{ backgroundColor: '#0F172A' }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[16px] font-sans font-semibold uppercase tracking-[5px] text-white mb-2">Calendario</p>
            <h3 className="text-2xl font-serif font-bold text-white">Proximos Eventos</h3>
          </div>
          <Calendar className="w-5 h-5 text-white/20" />
        </div>

        {/* Scrollable cards */}
        <div
          className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.event-scroll::-webkit-scrollbar { display: none; }`}</style>
          {events.map((e, i) => {
            const isToday = e.diffDays === 0
            const isSoon = e.diffDays <= 7
            const Icon = e.type === 'birthday' ? Gift : Heart

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="flex-shrink-0 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: isToday ? '#B8654A' : 'rgba(255,255,255,0.05)',
                  width: 220,
                  border: '6px solid rgba(255,255,255,0.8)',
                }}
              >
                {/* Date */}
                <div className="text-center pt-8 pb-3 px-5">
                  <p className={`text-4xl font-serif font-bold leading-none ${isToday ? 'text-white' : 'text-white/90'}`}>
                    {e.day}
                  </p>
                  <p className={`text-[11px] font-medium uppercase tracking-wider mt-1 ${isToday ? 'text-white/70' : 'text-white/30'}`}>
                    {MESES[e.month]}
                  </p>
                </div>

                {/* Body */}
                <div className="px-5 py-6 text-center">
                  <div className="flex justify-center mb-4">
                    {e.photoURL ? (
                      <img
                        src={e.photoURL}
                        alt={e.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white/30 cursor-pointer hover:border-white/60 transition-all hover:scale-105"
                        onClick={() => setLightboxPhoto({ url: e.photoURL, name: e.fullName })}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full flex items-center justify-center text-base font-bold bg-white/10 text-white/60">
                        {initials(e.name)}
                      </div>
                    )}
                  </div>

                  <p className={`text-sm font-semibold leading-tight mb-1 truncate ${isToday ? 'text-white' : 'text-white/80'}`}>
                    {e.name}
                  </p>

                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Icon className={`w-3 h-3 ${isToday ? 'text-white/60' : 'text-white/30'}`} />
                    <span className={`text-[10px] ${isToday ? 'text-white/60' : 'text-white/30'}`}>
                      {e.type === 'birthday' ? 'Cumple' : 'Aniversario'}
                    </span>
                  </div>

                  <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                    isToday ? 'bg-white/20 text-white' : isSoon ? 'bg-[#B8654A]/20 text-[#B8654A]' : 'bg-white/5 text-white/40'
                  }`}>
                    {isToday && <PartyPopper className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
                    {formatDiff(e.diffDays)}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxPhoto(null)}
          >
            <motion.div
              className="relative max-w-4xl max-h-[90vh]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxPhoto(null)}
                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition"
              >
                <X className="w-6 h-6 text-gray-800" />
              </button>
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.name}
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              />
              <div className="mt-4 text-center">
                <p className="text-white text-lg font-semibold">{lightboxPhoto.name}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
