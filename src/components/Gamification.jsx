import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Camera, Users, Heart, MapPin, Star } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

const badges = [
  { id: 'first10', label: 'Primeros 10', desc: '10 miembros registrados', icon: Users, check: (p) => p.length >= 10 },
  { id: 'first50', label: 'Familia Grande', desc: '50 miembros registrados', icon: Users, check: (p) => p.length >= 50 },
  { id: 'first100', label: 'Centenario', desc: '100 miembros registrados', icon: Star, check: (p) => p.length >= 100 },
  { id: 'photographer', label: 'Fotografo', desc: '50% con foto', icon: Camera, check: (p) => p.filter(x => x.photoURL).length / p.length >= 0.5 },
  { id: 'biographer', label: 'Biografo', desc: '50% con biografia', icon: Heart, check: (p) => p.filter(x => x.bio).length / p.length >= 0.5 },
  { id: 'mapper', label: 'Cartografo', desc: '50% con ubicacion', icon: MapPin, check: (p) => p.filter(x => x.location).length / p.length >= 0.5 },
]

export default function Gamification() {
  const [people, setPeople] = useState([])
  const [earned, setEarned] = useState([])

  useEffect(() => {
    async function load() {
      const [members, gp] = await Promise.all([getFamilyMembers(), getGrandparents()])
      const all = []
      const walk = (p) => { if (p.name) all.push(p); if (p.spouse?.name) all.push(p.spouse); (p.children || []).forEach(walk) }
      if (gp?.grandfather) all.push(gp.grandfather)
      if (gp?.grandmother) all.push(gp.grandmother)
      members.forEach(walk)
      setPeople(all)
      setEarned(badges.filter(b => b.check(all)).map(b => b.id))
    }
    load()
  }, [])

  if (people.length === 0) return null

  return (
    <div className="py-8">
      <div className="text-center mb-6">
        <p className="text-[11px] font-sans font-medium uppercase tracking-[5px] text-white/40 mb-4">Logros</p>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-5">
          Logros Familiares
        </h2>
        <div className="w-8 h-[1px] bg-[#B8654A] mx-auto mb-5" />
      </div>
      <div className="flex flex-wrap gap-3">
        {badges.map(badge => {
          const Icon = badge.icon
          const isEarned = earned.includes(badge.id)
          return (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isEarned ? 'bg-[#B8976A]/10 border-[#B8976A]/30' : 'bg-white/5 border-white/80 opacity-40'}`}
            >
              <Icon className={`w-5 h-5 ${isEarned ? 'text-[#B8976A]' : 'text-white/30'}`} />
              <div>
                <p className={`text-xs font-bold ${isEarned ? 'text-white' : 'text-white/40'}`}>{badge.label}</p>
                <p className="text-[10px] text-white/50">{badge.desc}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
