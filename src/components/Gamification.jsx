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
    <div className="py-16">
      <div className="text-center mb-12">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: '3rem' }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 1.2 }}
          className="decorative-line mx-auto mb-8"
        />
        <p className="elegant-caps text-white/60 mb-6">Logros</p>
        <h2 className="elegant-heading text-5xl sm:text-6xl text-white mb-6" style={{ letterSpacing: '-0.02em' }}>
          Logros Familiares
        </h2>
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-accent/30" />
          <svg width="8" height="8" viewBox="0 0 8 8" className="text-accent/40">
            <circle cx="4" cy="4" r="2" fill="currentColor" />
          </svg>
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-accent/30" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        {badges.map(badge => {
          const Icon = badge.icon
          const isEarned = earned.includes(badge.id)
          return (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              className={`glass-panel rounded-2xl flex items-center gap-3 px-5 py-3 ${!isEarned && 'opacity-40'}`}
              style={{
                backgroundColor: isEarned ? 'rgba(184, 151, 106, 0.1)' : undefined,
                borderColor: isEarned ? 'rgba(184, 151, 106, 0.2)' : undefined,
              }}
            >
              <Icon className={`w-6 h-6 ${isEarned ? 'text-accent' : 'text-white/30'}`} />
              <div>
                <p className={`elegant-heading text-sm ${isEarned ? 'text-white' : 'text-white/40'}`}>{badge.label}</p>
                <p className="text-xs text-white/50 font-medium">{badge.desc}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
