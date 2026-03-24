import { useState, useEffect } from 'react'
import { Gift, Heart, X } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

export default function WeeklyBanner() {
  const [events, setEvents] = useState([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function load() {
      const [members, gp] = await Promise.all([getFamilyMembers(), getGrandparents()])
      const today = new Date()
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      const upcoming = []

      const checkDate = (person, dateField, type) => {
        if (!person[dateField]) return
        const [y, m, d] = person[dateField].split('-').map(Number)
        const thisYear = today.getFullYear()
        const eventDate = new Date(thisYear, m - 1, d)
        if (eventDate >= today && eventDate <= weekFromNow) {
          upcoming.push({ name: person.name?.split(' ')[0], type, date: eventDate, day: d, month: m })
        }
      }

      const walk = (p) => {
        checkDate(p, 'birthDate', 'birthday')
        checkDate(p, 'weddingDate', 'anniversary')
        if (p.spouse && typeof p.spouse === 'object') checkDate(p.spouse, 'birthDate', 'birthday')
        (p.children || []).forEach(walk)
      }

      if (gp?.grandfather) checkDate(gp.grandfather, 'birthDate', 'birthday')
      if (gp?.grandmother) checkDate(gp.grandmother, 'birthDate', 'birthday')
      members.forEach(walk)

      setEvents(upcoming.sort((a, b) => a.date - b.date))
    }
    load()
  }, [])

  if (events.length === 0 || dismissed) return null

  return (
    <div className="relative bg-gradient-to-r from-[#C4704B]/10 to-[#B8943E]/10 border border-[#C4704B]/20 rounded-xl px-4 py-3 mb-4">
      <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 text-[#5D4037]/30 hover:text-[#5D4037]/60">
        <X className="w-4 h-4" />
      </button>
      <p className="text-xs font-bold text-[#C4704B] uppercase tracking-wider mb-1">Esta semana</p>
      <div className="flex flex-wrap gap-2">
        {events.map((e, i) => (
          <span key={i} className="flex items-center gap-1 text-xs text-[#5D4037] bg-white/60 px-2 py-1 rounded-full">
            {e.type === 'birthday' ? <Gift className="w-3 h-3 text-[#7A9E7E]" /> : <Heart className="w-3 h-3 text-[#C4704B]" />}
            {e.name} ({e.day}/{e.month})
          </span>
        ))}
      </div>
    </div>
  )
}
