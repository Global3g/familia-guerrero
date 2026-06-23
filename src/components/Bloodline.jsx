import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Users, ArrowDown, Shield } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

const PALETTE = {
  primary: '#152238',
  copper: '#B8963E',
  gold: '#B8976A',
  green: '#6B9080',
  bg: '#F5F0E8',
}

const GENERATION_COLORS = ['#152238', '#B8963E', '#B8976A', '#6B9080', '#C8846A', '#C8A87A']

function collectAllPeople(members, grandparentsData) {
  const people = []

  if (grandparentsData) {
    const gf = grandparentsData.grandfather
    const gm = grandparentsData.grandmother
    if (gf?.name) people.push({ ...gf, generation: 1, gender: gf.gender || 'M' })
    if (gm?.name) people.push({ ...gm, generation: 1, gender: gm.gender || 'F' })
  }

  const walk = (person, generation) => {
    if (person.name) {
      people.push({ ...person, generation })
    }
    if (person.spouse && typeof person.spouse === 'object' && person.spouse.name) {
      people.push({ ...person.spouse, generation })
    }
    if (person.children) {
      person.children.forEach((c) => walk(c, generation + 1))
    }
  }

  members.forEach((m) => walk(m, 2))
  return people
}

function isGuerrero(name) {
  return name && name.toLowerCase().includes('guerrero')
}

const generationLabels = {
  1: 'Abuelos',
  2: 'Hijos',
  3: 'Nietos',
  4: 'Bisnietos',
  5: 'Tataranietos',
}

function getGenerationLabel(gen) {
  return generationLabels[gen] || `Generacion ${gen}`
}

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className="glass-panel rounded-3xl p-8 text-center min-h-[180px] flex flex-col justify-between"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-accent/5 border border-accent/10"
      >
        <Icon size={28} className="text-accent" />
      </div>
      <div>
        <p className="elegant-heading text-4xl mb-2" style={{ color: '#1C1C1C' }}>
          {value}
        </p>
        <p className="elegant-caps" style={{ color: '#8A8A8A' }}>{label}</p>
      </div>
    </motion.div>
  )
}

function GenerationBar({ label, guerreroCount, totalCount, color, delay = 0 }) {
  const pct = totalCount > 0 ? Math.round((guerreroCount / totalCount) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="mb-4"
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold text-sm" style={{ color: '#1C1C1C' }}>
          {label}
        </span>
        <span className="text-sm" style={{ color: '#4A4A4A' }}>
          {guerreroCount} de {totalCount} llevan el apellido ({pct}%)
        </span>
      </div>
      <div className="w-full bg-black/8 rounded-full h-5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.3, duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full flex items-center justify-end pr-2"
          style={{ backgroundColor: color, minWidth: pct > 0 ? '2rem' : 0 }}
        >
          {pct > 10 && <span className="text-white text-xs font-bold">{pct}%</span>}
        </motion.div>
      </div>
    </motion.div>
  )
}

function PersonChip({ name, delay = 0 }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.3 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white m-1"
      style={{ backgroundColor: PALETTE.copper }}
    >
      <Shield size={12} />
      {name}
    </motion.span>
  )
}

export default function Bloodline() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [members, grandparentsData] = await Promise.all([
          getFamilyMembers(),
          getGrandparents(),
        ])
        const all = collectAllPeople(members, grandparentsData)
        setPeople(all)
      } catch (err) {
        console.error('Error loading bloodline data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const guerreros = people.filter((p) => isGuerrero(p.name))
  const totalPeople = people.length
  const totalGuerreros = guerreros.length
  const pctGlobal = totalPeople > 0 ? Math.round((totalGuerreros / totalPeople) * 100) : 0

  // Group by generation
  const generations = {}
  people.forEach((p) => {
    if (!generations[p.generation]) {
      generations[p.generation] = { total: 0, guerreros: 0, guerreroNames: [] }
    }
    generations[p.generation].total++
    if (isGuerrero(p.name)) {
      generations[p.generation].guerreros++
      generations[p.generation].guerreroNames.push(p.name)
    }
  })

  const sortedGens = Object.keys(generations)
    .map(Number)
    .sort((a, b) => a - b)

  const generationsSpanned = sortedGens.filter((g) => generations[g].guerreros > 0).length

  if (loading) {
    return (
      <section id="linea-de-sangre" className="py-20" style={{ backgroundColor: PALETTE.bg }}>
        <div className="max-w-[1600px] mx-auto px-4 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-64 mx-auto" />
            <div className="h-4 bg-white/10 rounded w-96 mx-auto" />
            <div className="h-48 bg-white/10 rounded mt-8" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="linea-de-sangre" className="py-32" style={{ backgroundColor: PALETTE.bg }}>
      <div className="max-w-[1600px] mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center mb-24"
        >
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '3rem' }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 1.2 }}
            className="decorative-line mx-auto mb-8"
          />
          <p className="elegant-caps mb-6" style={{ color: '#8A8A8A' }}>Linaje</p>
          <h2 className="elegant-heading text-5xl sm:text-6xl md:text-7xl italic mb-6" style={{ letterSpacing: '-0.02em', color: '#1C1C1C' }}>
            Línea de Sangre Guerrero
          </h2>
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-accent/30" />
            <svg width="8" height="8" viewBox="0 0 8 8" className="text-accent/40">
              <circle cx="4" cy="4" r="2" fill="currentColor" />
            </svg>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-accent/30" />
          </div>
          <p className="elegant-subheading text-2xl max-w-2xl mx-auto leading-relaxed" style={{ color: '#4A4A4A' }}>
            Cómo se propaga nuestro apellido a través de las generaciones
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          <StatCard
            icon={Shield}
            label="Total Guerreros"
            value={totalGuerreros}
            delay={0}
          />
          <StatCard
            icon={Users}
            label="Porcentaje con el apellido"
            value={`${pctGlobal}%`}
            delay={0.15}
          />
          <StatCard
            icon={GitBranch}
            label="Generaciones con el apellido"
            value={generationsSpanned}
            delay={0.3}
          />
        </div>

        {/* Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-panel rounded-3xl p-10 mb-16"
        >
          <h3 className="elegant-heading text-2xl mb-8 flex items-center gap-2" style={{ color: '#1C1C1C' }}>
            <GitBranch size={22} className="text-accent" />
            Propagación del Apellido por Generación
          </h3>

          {/* Shield at top */}
          <div className="flex flex-col items-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-md"
              style={{ backgroundColor: PALETTE.primary }}
            >
              <Shield size={30} className="text-white" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-sm font-bold mt-2" style={{ color: '#1C1C1C' }}
            >
              Apellido Guerrero
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <ArrowDown size={24} className="mt-2" style={{ color: PALETTE.gold }} />
            </motion.div>
          </div>

          {/* Generation Bars */}
          <div className="space-y-2">
            {sortedGens.map((gen, i) => (
              <div key={gen}>
                <GenerationBar
                  label={getGenerationLabel(gen)}
                  guerreroCount={generations[gen].guerreros}
                  totalCount={generations[gen].total}
                  color={GENERATION_COLORS[i % GENERATION_COLORS.length]}
                  delay={i * 0.15}
                />
                {i < sortedGens.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 + 0.2 }}
                    className="flex justify-center my-1"
                  >
                    <ArrowDown size={18} style={{ color: PALETTE.gold }} />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* People who carry the surname, grouped by generation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-panel rounded-3xl p-10"
        >
          <h3 className="elegant-heading text-2xl mb-8 flex items-center gap-2" style={{ color: '#1C1C1C' }}>
            <Users size={22} className="text-accent" />
            Quiénes Llevan el Apellido Guerrero
          </h3>

          {sortedGens.map((gen) => {
            const names = generations[gen].guerreroNames
            if (names.length === 0) return null
            return (
              <div key={gen} className="mb-6 last:mb-0">
                <h4
                  className="text-sm font-bold uppercase tracking-wider mb-2"
                  style={{ color: GENERATION_COLORS[(gen - 1) % GENERATION_COLORS.length] }}
                >
                  {getGenerationLabel(gen)} ({names.length})
                </h4>
                <div className="flex flex-wrap">
                  {names.map((name, i) => (
                    <PersonChip key={name + i} name={name} delay={i * 0.05} />
                  ))}
                </div>
              </div>
            )
          })}

          {totalGuerreros === 0 && (
            <p className="text-center py-8" style={{ color: '#8A8A8A' }}>
              No se encontraron miembros con el apellido Guerrero.
            </p>
          )}
        </motion.div>

        {/* Other branches note */}
        {totalPeople - totalGuerreros > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-sm" style={{ color: '#8A8A8A' }}>
              Otras ramas: {totalPeople - totalGuerreros} miembros de la familia llevan otros apellidos
              por matrimonio u otras uniones.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}
