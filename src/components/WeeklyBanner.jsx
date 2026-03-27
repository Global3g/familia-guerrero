import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Gift, Heart, PartyPopper, Calendar } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_FULL = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function WeeklyBanner() {
  const [events, setEvents] = useState([])

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
    if (e.diffDays === 0) return { bg: '#C4704B', text: 'white', accent: '#FFD6C4' }
    if (e.diffDays <= 7) return { bg: '#FFF3ED', text: '#C4704B', accent: '#C4704B' }
    if (e.type === 'anniversary') return { bg: '#FDF6EE', text: '#B8943E', accent: '#B8943E' }
    return { bg: '#F2F7F3', text: '#5D4037', accent: '#7A9E7E' }
  }

  const initials = (name) => (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <section className="py-6" style={{ backgroundColor: '#FFFDF7' }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5" style={{ color: '#C4704B' }} />
          <h3 className="text-lg font-serif font-bold" style={{ color: '#5D4037' }}>
            Proximos Eventos
          </h3>
        </div>

        {/* Scrollable cards */}
        <div
          className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.event-scroll::-webkit-scrollbar { display: none; }`}</style>
          {events.map((e, i) => {
            const c = getColors(e)
            const isToday = e.diffDays === 0
            const Icon = e.type === 'birthday' ? Gift : Heart

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex-shrink-0 rounded-2xl overflow-hidden relative"
                style={{
                  backgroundColor: c.bg,
                  width: 180,
                  border: isToday ? `2px solid ${c.bg}` : '1px solid #E0D5C830',
                  boxShadow: isToday ? '0 4px 20px rgba(196,112,75,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {/* Date header */}
                <div
                  className="text-center py-3.5 px-4"
                  style={{ backgroundColor: isToday ? '#C4704B' : `${c.accent}15` }}
                >
                  <p
                    className="text-3xl font-bold leading-none"
                    style={{ color: isToday ? 'white' : c.accent }}
                  >
                    {e.day}
                  </p>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: isToday ? 'rgba(255,255,255,0.8)' : `${c.accent}99` }}
                  >
                    {MESES[e.month]}
                  </p>
                </div>

                {/* Body */}
                <div className="px-4 py-4 text-center">
                  {/* Avatar */}
                  <div className="flex justify-center mb-2">
                    {e.photoURL ? (
                      <img
                        src={e.photoURL}
                        alt={e.name}
                        className="w-12 h-12 rounded-full object-cover"
                        style={{ border: `2px solid ${c.accent}40` }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: `${c.accent}20`, color: c.accent }}
                      >
                        {initials(e.name)}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <p
                    className="text-base font-bold leading-tight mb-1 truncate"
                    style={{ color: isToday ? '#5D4037' : c.text }}
                  >
                    {e.name}
                  </p>

                  {/* Type badge */}
                  <div className="flex items-center justify-center gap-1 mb-1.5">
                    <Icon className="w-3 h-3" style={{ color: c.accent }} />
                    <span className="text-[10px] font-medium" style={{ color: `${c.text}90` }}>
                      {e.type === 'birthday' ? 'Cumple' : 'Aniversario'}
                    </span>
                  </div>

                  {/* Countdown */}
                  <span
                    className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isToday ? '#C4704B' : `${c.accent}18`,
                      color: isToday ? 'white' : c.accent,
                    }}
                  >
                    {isToday && <PartyPopper className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
                    {formatDiff(e.diffDays)}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
