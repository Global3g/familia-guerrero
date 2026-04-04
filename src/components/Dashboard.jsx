import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, TreePine, Calendar, TrendingUp, MapPin, Globe } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

function collectStats(members, grandparents) {
  let total = 0
  let maxGen = 1

  const gf = grandparents?.grandfather
  const gm = grandparents?.grandmother
  if (gf?.name) total++
  if (gm?.name) total++

  const walk = (person, gen) => {
    if (!person) return
    if (person.name) {
      total++
      if (gen > maxGen) maxGen = gen
    }
    if (person.spouse?.name) {
      total++
    }
    if (person.children) {
      person.children.forEach((c) => walk(c, gen + 1))
    }
  }

  if (Array.isArray(members)) {
    members.forEach((m) => walk(m, 2))
  }

  let oldestYear = 9999
  const checkYear = (date) => {
    if (!date) return
    const y = parseInt(date.split('-')[0])
    if (y > 1800 && y < oldestYear) oldestYear = y
  }
  if (gf?.birthDate) checkYear(gf.birthDate)
  if (gm?.birthDate) checkYear(gm.birthDate)

  return { total, generations: maxGen, since: oldestYear < 9999 ? oldestYear : null }
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [members, grandparents] = await Promise.all([
          getFamilyMembers(),
          getGrandparents(),
        ])
        const data = collectStats(members, grandparents)
        setStats(data)
      } catch (err) {
        console.error('Dashboard: could not load stats', err)
      }
    }
    load()
  }, [])

  return (
    <section id="dashboard" className="pt-10 scroll-mt-24 max-w-7xl mx-auto px-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex items-end justify-between mb-8 border-b border-white/10 pb-4"
      >
        <div>
          <h2 className="text-3xl font-serif text-white">Panorama Familiar</h2>
          <p className="text-sm text-white/50 font-sans mt-1">El estado de nuestro linaje al día de hoy.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Main Intro Card (Spans 2 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-panel rounded-2xl p-8 lg:col-span-2 relative overflow-hidden group"
        >
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1502472584811-0a2f2feb8968?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay" />
          <div className="relative z-10 h-full flex flex-col justify-between">
            <svg className="w-8 h-8 text-accent/50 mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
            </svg>
            <div>
              <h3 className="text-2xl font-serif text-white mb-2">Bienvenidos al Archivo Digital</h3>
              <p className="text-white/70 font-sans text-sm leading-relaxed mb-6">
                Este espacio fue creado para preservar la memoria, conectar ramas dispersas de la familia y celebrar los hitos que definen el nombre Guerrero. Desde las montañas de Andalucía hasta América, nuestra historia continúa escribiéndose.
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-sans text-accent">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-secondary mr-2" />
                Sistema Actualizado
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stat Card 1 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-panel rounded-2xl p-6 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50 mb-1">Miembros Registrados</p>
            <p className="text-4xl font-serif text-white">{stats?.total || 0}</p>
            <p className="text-xs text-secondary mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +4 este año
            </p>
          </div>
        </motion.div>

        {/* Stat Card 2 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-panel rounded-2xl p-6 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-accent">
              <TreePine className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50 mb-1">Generaciones</p>
            <p className="text-4xl font-serif text-white">{stats?.generations || 0}</p>
            <p className="text-xs text-white/40 mt-2">
              {stats?.since ? `Datan desde ${stats.since}` : 'Historia familiar'}
            </p>
          </div>
        </motion.div>

        {/* Origins Map Module */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80')] bg-cover bg-center bg-no-repeat relative"
        >
          <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-sm rounded-2xl" />
          <div className="relative z-10 flex flex-col w-full h-full text-center items-center justify-center space-y-3">
            <Globe className="w-8 h-8 text-secondary" />
            <h3 className="font-serif text-xl">Expansión Territorial</h3>
            <p className="text-sm font-sans text-white/70 max-w-md">
              Raíces en <span className="text-white font-medium">Sevilla, España</span> con ramas
              significativas en <span className="text-white font-medium">México, Argentina y Canadá</span>.
            </p>
            <button className="mt-4 px-4 py-2 rounded-full border border-secondary/40 text-xs font-sans hover:bg-secondary/20 transition-colors uppercase tracking-widest text-secondary">
              Ver Orígenes
            </button>
          </div>
        </motion.div>

        {/* Upcoming Event Mini-Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          id="eventos"
          className="glass-panel rounded-2xl p-6 lg:col-span-2 relative border-l-4 border-l-primary flex flex-col sm:flex-row items-center gap-6"
        >
          <div className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/30 flex flex-col items-center justify-center shrink-0">
            <span className="text-xs uppercase tracking-wider text-primary font-bold">Oct</span>
            <span className="text-2xl font-serif text-white">24</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-[10px] text-accent uppercase tracking-widest mb-1">Próximo Evento Oficial</div>
            <h3 className="text-xl font-serif text-white mb-2">Reunión Anual G-2024</h3>
            <p className="text-sm text-white/60 font-sans line-clamp-2">
              Nuestra tradicional junta de otoño. Este año organizada por la rama de los Guerrero-Méndez
              en Valle de Bravo. Se ruega confirmación de asistencia.
            </p>
          </div>
          <button className="shrink-0 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  )
}
