import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Calendar, Heart, Star, Gift, Clock } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

const COLORS = {
  birthday: '#7A9E7E',
  anniversary: '#C4704B',
  memorial: '#B8943E',
  milestone: '#E8956D',
}

const ICONS = {
  birthday: Gift,
  anniversary: Heart,
  memorial: Star,
  milestone: Bell,
}

const MILESTONE_BIRTHDAYS = [50, 60, 70, 80, 90, 100]
const MILESTONE_ANNIVERSARIES = { 25: 'Plata', 50: 'Oro' }

function parseDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

function getDaysUntilNextOccurrence(month, day, fromDate) {
  const thisYear = fromDate.getFullYear()
  let next = new Date(thisYear, month, day)
  if (next < fromDate) {
    next = new Date(thisYear + 1, month, day)
  }
  const diff = Math.floor((next - fromDate) / (1000 * 60 * 60 * 24))
  return { daysUntil: diff, nextDate: next }
}

function collectAllPeople(members, grandparentsData) {
  const people = []

  // Add grandparents
  if (grandparentsData) {
    const gf = grandparentsData.grandfather
    const gm = grandparentsData.grandmother
    if (gf?.name) {
      people.push({
        name: gf.name,
        birthDate: gf.birthDate,
        deathDate: gf.deathDate,
        weddingDate: grandparentsData.weddingDate,
      })
    }
    if (gm?.name) {
      people.push({
        name: gm.name,
        birthDate: gm.birthDate,
        deathDate: gm.deathDate,
        weddingDate: grandparentsData.weddingDate,
      })
    }
  }

  // Recursive walk of family members
  function walkPerson(person) {
    if (!person) return
    if (person.name) {
      people.push({
        name: person.name,
        birthDate: person.birthDate,
        deathDate: person.deathDate,
        weddingDate: person.weddingDate,
      })
    }
    if (person.spouse?.name) {
      people.push({
        name: person.spouse.name,
        birthDate: person.spouse.birthDate,
        deathDate: person.spouse.deathDate,
        weddingDate: person.weddingDate,
      })
    }
    if (Array.isArray(person.children)) {
      person.children.forEach(walkPerson)
    }
  }

  members.forEach(walkPerson)
  return people
}

function generateReminders(people) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const reminders = []
  const seenWeddings = new Set()

  people.forEach((person) => {
    const birth = parseDate(person.birthDate)
    const death = parseDate(person.deathDate)
    const wedding = parseDate(person.weddingDate)

    // Upcoming birthdays (next 30 days) - only for living people
    if (birth && !death) {
      const { daysUntil, nextDate } = getDaysUntilNextOccurrence(birth.getMonth(), birth.getDate(), today)
      if (daysUntil <= 30) {
        const age = nextDate.getFullYear() - birth.getFullYear()
        const isMilestone = MILESTONE_BIRTHDAYS.includes(age)

        reminders.push({
          type: isMilestone ? 'milestone' : 'birthday',
          title: isMilestone ? `${person.name} cumple ${age} anos` : `Cumpleanos de ${person.name}`,
          subtitle: isMilestone
            ? 'Un cumpleanos muy especial'
            : `Cumple ${age} anos`,
          person: person.name,
          date: nextDate,
          daysUntil,
          sortKey: daysUntil,
        })
      }
    }

    // Milestone birthdays specifically (also check if non-milestone wasn't already added)
    if (birth && !death) {
      const { daysUntil, nextDate } = getDaysUntilNextOccurrence(birth.getMonth(), birth.getDate(), today)
      const age = nextDate.getFullYear() - birth.getFullYear()
      if (daysUntil > 30 && daysUntil <= 30 && MILESTONE_BIRTHDAYS.includes(age)) {
        // Already handled above within 30 days
      }
    }

    // Wedding anniversaries (next 30 days)
    if (wedding) {
      const weddingKey = person.weddingDate
      if (!seenWeddings.has(weddingKey)) {
        seenWeddings.add(weddingKey)
        const { daysUntil, nextDate } = getDaysUntilNextOccurrence(wedding.getMonth(), wedding.getDate(), today)
        if (daysUntil <= 30) {
          const years = nextDate.getFullYear() - wedding.getFullYear()
          const milestoneLabel = MILESTONE_ANNIVERSARIES[years]

          if (milestoneLabel) {
            reminders.push({
              type: 'milestone',
              title: `Bodas de ${milestoneLabel}`,
              subtitle: `${years} anos de matrimonio`,
              person: person.name,
              date: nextDate,
              daysUntil,
              sortKey: daysUntil,
            })
          } else {
            reminders.push({
              type: 'anniversary',
              title: `Aniversario de boda`,
              subtitle: `${years} anos de matrimonio`,
              person: person.name,
              date: nextDate,
              daysUntil,
              sortKey: daysUntil,
            })
          }
        }
      }
    }

    // Memorial dates - death anniversary
    if (death) {
      const { daysUntil, nextDate } = getDaysUntilNextOccurrence(death.getMonth(), death.getDate(), today)
      if (daysUntil <= 30) {
        const years = nextDate.getFullYear() - death.getFullYear()
        reminders.push({
          type: 'memorial',
          title: `En memoria de ${person.name}`,
          subtitle: `Hace ${years} anos fallecio`,
          person: person.name,
          date: nextDate,
          daysUntil,
          sortKey: daysUntil,
        })
      }
    }
  })

  // Sort by closest date first, then slice to max 10
  reminders.sort((a, b) => a.sortKey - b.sortKey)
  return reminders.slice(0, 10)
}

function formatDateShort(date) {
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
  })
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function Reminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [members, grandparents] = await Promise.all([
          getFamilyMembers(),
          getGrandparents(),
        ])
        const people = collectAllPeople(members, grandparents)
        const generated = generateReminders(people)
        setReminders(generated)
      } catch (err) {
        console.error('Error loading reminders:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <section id="recordatorios" className="py-20 px-4" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar className="w-7 h-7" style={{ color: '#C4704B' }} />
            <h2 className="text-3xl md:text-4xl font-serif font-bold" style={{ color: '#5D4037' }}>
              No Olvides Estas Fechas
            </h2>
          </div>
          <p className="text-sm" style={{ color: '#5D4037', opacity: 0.6 }}>
            Recordatorios automaticos de los proximos 30 dias
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Clock className="w-8 h-8 animate-spin" style={{ color: '#C4704B' }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && reminders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <Bell className="w-12 h-12 mx-auto mb-4" style={{ color: '#B8943E', opacity: 0.4 }} />
            <p className="text-lg font-serif" style={{ color: '#5D4037', opacity: 0.5 }}>
              No hay recordatorios proximos
            </p>
          </motion.div>
        )}

        {/* Timeline list */}
        {!loading && reminders.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="relative"
          >
            {/* Vertical timeline line */}
            <div
              className="absolute left-6 top-0 bottom-0 w-0.5"
              style={{ backgroundColor: '#5D403720' }}
            />

            <div className="space-y-4">
              {reminders.map((reminder, idx) => {
                const color = COLORS[reminder.type]
                const Icon = ICONS[reminder.type]
                const isToday = reminder.daysUntil === 0

                return (
                  <motion.div
                    key={`${reminder.type}-${reminder.person}-${idx}`}
                    variants={itemVariants}
                    className="relative pl-16"
                  >
                    {/* Icon circle on timeline */}
                    <motion.div
                      className="absolute left-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm z-10"
                      style={{ backgroundColor: color }}
                      animate={
                        isToday
                          ? {
                              scale: [1, 1.2, 1],
                              boxShadow: [
                                `0 0 0 0px ${color}40`,
                                `0 0 0 8px ${color}00`,
                                `0 0 0 0px ${color}40`,
                              ],
                            }
                          : {}
                      }
                      transition={
                        isToday
                          ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                          : {}
                      }
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </motion.div>

                    {/* Reminder card */}
                    <div
                      className="rounded-xl shadow-sm p-4 border-l-4"
                      style={{
                        backgroundColor: isToday ? `${color}15` : '#FFFFFF',
                        borderLeftColor: color,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-bold mb-0.5"
                            style={{ color }}
                          >
                            {reminder.title}
                          </p>
                          <p
                            className="text-xs mb-1"
                            style={{ color: '#5D4037', opacity: 0.7 }}
                          >
                            {reminder.subtitle}
                          </p>
                          <p
                            className="text-xs flex items-center gap-1"
                            style={{ color: '#5D4037', opacity: 0.5 }}
                          >
                            <Calendar className="w-3 h-3" />
                            {formatDateShort(reminder.date)}
                          </p>
                        </div>

                        {/* Countdown badge */}
                        <div
                          className="flex-shrink-0 rounded-lg px-3 py-1.5 text-center"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          {isToday ? (
                            <motion.div
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <p className="text-xs font-bold" style={{ color }}>
                                HOY
                              </p>
                            </motion.div>
                          ) : (
                            <>
                              <p className="text-lg font-bold leading-none" style={{ color }}>
                                {reminder.daysUntil}
                              </p>
                              <p className="text-[11px]" style={{ color, opacity: 0.8 }}>
                                {reminder.daysUntil === 1 ? 'dia' : 'dias'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
