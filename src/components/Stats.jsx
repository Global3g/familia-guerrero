import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Users, Heart, Baby, Calendar, MapPin, Crown, Star } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

const COLORS = ['#B8654A', '#6B9080', '#B8976A', '#C8846A', '#0F172A', '#C8A87A', '#9BBAA8', '#64748B']

function calcAge(birthDate, deathDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const end = deathDate ? new Date(deathDate) : new Date()
  let age = end.getFullYear() - birth.getFullYear()
  const m = end.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--
  return age
}

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

function AnimatedNumber({ value }) {
  const [count, setCount] = useState(0)
  const numValue = parseInt(value) || 0

  useEffect(() => {
    if (numValue === 0) return
    let start = 0
    const duration = 1500
    const step = Math.ceil(numValue / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= numValue) {
        setCount(numValue)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [numValue])

  return <>{count}</>
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/5 rounded-2xl shadow-md p-5 text-center border-4 border-white/80"
    >
      <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-white/5">
        <Icon className="w-6 h-6" style={{ color: '#FFD700' }} />
      </div>
      <p className="text-3xl font-bold font-serif text-white"><AnimatedNumber value={value} /></p>
      <p className="text-xs text-white/40 uppercase tracking-wider mt-1">{label}</p>
      {sub && <p className="text-[11px] text-white/40 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

function ChartCard({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/5 rounded-2xl shadow-md p-5 border-4 border-white/80"
    >
      <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">{title}</h4>
      {children}
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1E293B] rounded-lg shadow-lg p-3 border-4 border-white/80 text-xs">
      <p className="font-bold text-white">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Stats() {
  const [people, setPeople] = useState([])
  const [members, setMembers] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [m, gp] = await Promise.all([getFamilyMembers(), getGrandparents()])
    setMembers(m)
    const all = collectAllPeople(m, gp)
    setPeople(all)
  }

  if (people.length === 0) return null

  // Calculations
  const alive = people.filter(p => !p.deathDate)
  const deceased = people.filter(p => p.deathDate)
  const males = people.filter(p => p.gender === 'M')
  const females = people.filter(p => p.gender === 'F')
  const unknown = people.filter(p => !p.gender || (p.gender !== 'M' && p.gender !== 'F'))

  const ages = alive.map(p => calcAge(p.birthDate)).filter(a => a !== null && a >= 0)
  const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0
  const youngest = ages.length > 0 ? Math.min(...ages) : 0
  const oldest = ages.length > 0 ? Math.max(...ages) : 0

  const youngestPerson = alive.reduce((min, p) => {
    const a = calcAge(p.birthDate)
    return a !== null && a >= 0 && (min === null || a < calcAge(min.birthDate)) ? p : min
  }, null)

  const oldestPerson = alive.reduce((max, p) => {
    const a = calcAge(p.birthDate)
    return a !== null && (max === null || a > calcAge(max.birthDate)) ? p : max
  }, null)

  // Generation distribution
  const genLabels = { 1: 'Abuelos', 2: 'Hijos', 3: 'Nietos', 4: 'Bisnietos', 5: 'Tataranietos' }
  const genCounts = {}
  people.forEach(p => {
    const g = p.generation || 1
    genCounts[g] = (genCounts[g] || 0) + 1
  })
  const genData = Object.entries(genCounts).map(([g, count]) => ({
    name: genLabels[g] || `Gen ${g}`,
    total: count,
  })).sort((a, b) => a.name.localeCompare(b.name))

  // Gender pie data
  const genderData = [
    ...(males.length > 0 ? [{ name: 'Hombres', value: males.length }] : []),
    ...(females.length > 0 ? [{ name: 'Mujeres', value: females.length }] : []),
    ...(unknown.length > 0 ? [{ name: 'Sin especificar', value: unknown.length }] : []),
  ]
  const genderColors = ['#94A3B8', '#B8654A', '#ccc']

  // Births by decade
  const decadeCounts = {}
  people.forEach(p => {
    if (p.birthDate) {
      const year = parseInt(p.birthDate.split('-')[0])
      const decade = Math.floor(year / 10) * 10
      decadeCounts[decade] = (decadeCounts[decade] || 0) + 1
    }
  })
  const decadeData = Object.entries(decadeCounts)
    .map(([decade, count]) => ({ name: `${decade}s`, nacimientos: count }))
    .sort((a, b) => a.name.localeCompare(b.name))

  // Largest families (by children count of top-level members)
  const familyData = members.map(m => {
    const totalDesc = (p) => (p.children || []).reduce((s, c) => s + 1 + totalDesc(c), 0)
    return {
      name: m.name?.split(' ')[0] || 'Sin nombre',
      descendientes: totalDesc(m),
    }
  }).sort((a, b) => b.descendientes - a.descendientes).slice(0, 8)

  // Birthdays this month
  const currentMonth = new Date().getMonth() + 1
  const birthdaysThisMonth = alive.filter(p => {
    if (!p.birthDate) return false
    const month = parseInt(p.birthDate.split('-')[1])
    return month === currentMonth
  })

  // Marriage years - uses deathDate as end for deceased members
  const marriageYears = people
    .filter(p => p.weddingDate)
    .map(p => {
      const wd = new Date(p.weddingDate)
      const end = p.deathDate ? new Date(p.deathDate) : new Date()
      let y = end.getFullYear() - wd.getFullYear()
      if (end.getMonth() < wd.getMonth() || (end.getMonth() === wd.getMonth() && end.getDate() < wd.getDate())) y--
      return y
    })
    .filter(y => y > 0)
  const totalMarriageYears = marriageYears.reduce((a, b) => a + b, 0)

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  return (
    <section id="estadisticas" className="py-20 px-4 sm:px-6 lg:px-10" style={{ backgroundColor: '#0F172A' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-sans font-medium uppercase tracking-[5px] text-white/40 mb-4">Estadisticas</p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-5">
            Nuestra Familia en Numeros
          </h2>
          <div className="w-8 h-[1px] bg-[#B8654A] mx-auto mb-5" />
          <p className="text-lg max-w-2xl mx-auto text-white/50">
            Cada numero cuenta una historia. Asi crece el legado Guerrero.
          </p>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          <StatCard icon={Users} label="Total familia" value={people.length} color="#0F172A" />
          <StatCard icon={Heart} label="Vivos" value={alive.length} color="#6B9080" />
          <StatCard icon={Star} label="En memoria" value={deceased.length} color="#B8976A" />
          <StatCard icon={Users} label="Hombres" value={males.length} color="#0F172A" />
          <StatCard icon={Users} label="Mujeres" value={females.length} color="#B8654A" />
          <StatCard icon={Calendar} label="Edad promedio" value={avgAge} color="#C8846A" sub="de los vivos" />
        </div>

        {/* Second row of stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <StatCard icon={Baby} label="Mas joven" value={`${youngest} a`} color="#6B9080" sub={youngestPerson?.name?.split(' ')[0]} />
          <StatCard icon={Crown} label="Mayor" value={`${oldest} a`} color="#B8976A" sub={oldestPerson?.name?.split(' ')[0]} />
          <StatCard icon={Heart} label="Anos de matrimonio" value={totalMarriageYears} color="#B8654A" sub="acumulados" />
          <StatCard icon={Calendar} label={`Cumpleanos en ${monthNames[currentMonth - 1]}`} value={birthdaysThisMonth.length} color="#C8846A" />
        </div>

        {/* Birthday list this month */}
        {birthdaysThisMonth.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 rounded-2xl p-5 mb-12 border-4 border-white/80"
          >
            <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Cumpleanos en {monthNames[currentMonth - 1]}
            </h4>
            <div className="flex flex-wrap gap-3">
              {birthdaysThisMonth.map((p, i) => {
                const age = calcAge(p.birthDate)
                const day = parseInt(p.birthDate.split('-')[2])
                return (
                  <div key={i} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 shadow-sm">
                    <span className="text-sm font-bold text-[#B8654A]">{day}</span>
                    <span className="text-sm text-white">{p.name?.split(' ')[0]}</span>
                    {age && <span className="text-xs text-white/50 font-medium">cumple {age}</span>}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Generation distribution */}
          <ChartCard title="Distribucion por Generacion">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={genData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Personas" radius={[6, 6, 0, 0]}>
                  {genData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Gender distribution */}
          <ChartCard title="Hombres vs Mujeres">
            <div className="space-y-5 py-4">
              {/* Visual bars */}
              {genderData.map((g, i) => {
                const pct = Math.round((g.value / people.length) * 100)
                return (
                  <div key={g.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold" style={{ color: genderColors[i] }}>{g.name}</span>
                      <span className="text-lg font-bold" style={{ color: genderColors[i] }}>{g.value} <span className="text-xs font-normal text-white/40">({pct}%)</span></span>
                    </div>
                    <div className="w-full h-6 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.2 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: genderColors[i] }}
                      />
                    </div>
                  </div>
                )
              })}
              {/* Total */}
              <div className="text-center pt-3 border-t border-white/80">
                <span className="text-2xl font-bold text-white">{people.length}</span>
                <span className="text-xs text-white/50 ml-1">total de integrantes</span>
              </div>
            </div>
          </ChartCard>

          {/* Births by decade */}
          {decadeData.length > 0 && (
            <ChartCard title="Nacimientos por Decada">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={decadeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="nacimientos" name="Nacimientos" stroke="#6B9080" strokeWidth={3} dot={{ fill: '#6B9080', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Largest families */}
          {familyData.length > 0 && (
            <ChartCard title="Ramas Familiares mas Grandes">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={familyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="descendientes" name="Descendientes" radius={[0, 6, 6, 0]}>
                    {familyData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      </div>
    </section>
  )
}
