import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Gift, Heart, Star } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DAY_NAMES = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

const EVENT_COLORS = {
  birthday: '#7A9E7E',
  anniversary: '#C4704B',
  memorial: '#B8943E',
}

const EVENT_LABELS = {
  birthday: 'Cumpleaños',
  anniversary: 'Aniversario',
  memorial: 'Memorial',
}

function collectAllPeople(members, grandparentsData) {
  const people = []

  if (grandparentsData) {
    const gf = grandparentsData.grandfather
    const gm = grandparentsData.grandmother
    if (gf?.name) people.push({ ...gf })
    if (gm?.name) people.push({ ...gm })
  }

  const walk = (person) => {
    if (person.name) {
      people.push({ ...person })
    }
    if (person.spouse && typeof person.spouse === 'object' && person.spouse.name) {
      people.push({ ...person.spouse })
    }
    if (person.children) {
      person.children.forEach((c) => walk(c))
    }
  }

  members.forEach((m) => walk(m))
  return people
}

function extractEvents(people) {
  const events = []

  people.forEach((p) => {
    if (p.birthDate) {
      const d = new Date(p.birthDate + 'T00:00:00')
      if (!isNaN(d)) {
        events.push({
          month: d.getMonth(),
          day: d.getDate(),
          year: d.getFullYear(),
          type: 'birthday',
          name: p.name,
          date: p.birthDate,
        })
      }
    }
    if (p.weddingDate) {
      const d = new Date(p.weddingDate + 'T00:00:00')
      if (!isNaN(d)) {
        events.push({
          month: d.getMonth(),
          day: d.getDate(),
          year: d.getFullYear(),
          type: 'anniversary',
          name: p.name,
          date: p.weddingDate,
        })
      }
    }
    if (p.deathDate) {
      const d = new Date(p.deathDate + 'T00:00:00')
      if (!isNaN(d)) {
        events.push({
          month: d.getMonth(),
          day: d.getDate(),
          year: d.getFullYear(),
          type: 'memorial',
          name: p.name,
          date: p.deathDate,
        })
      }
    }
  })

  return events
}

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // Monday = 0, Sunday = 6
  let startWeekday = firstDay.getDay() - 1
  if (startWeekday < 0) startWeekday = 6

  const cells = []

  // Previous month filler days
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ day: prevMonthLastDay - i, currentMonth: false })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true })
  }

  // Next month filler days
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, currentMonth: false })
    }
  }

  return cells
}

function EventIcon({ type, size = 14 }) {
  if (type === 'birthday') return <Gift size={size} style={{ color: EVENT_COLORS.birthday }} />
  if (type === 'anniversary') return <Heart size={size} style={{ color: EVENT_COLORS.anniversary }} />
  if (type === 'memorial') return <Star size={size} style={{ color: EVENT_COLORS.memorial }} />
  return null
}

export default function FamilyCalendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState(null)

  const today = new Date()
  const isToday = (day) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear()

  useEffect(() => {
    async function load() {
      try {
        const [members, gp] = await Promise.all([getFamilyMembers(), getGrandparents()])
        const people = collectAllPeople(members, gp)
        setEvents(extractEvents(people))
      } catch (err) {
        console.error('Error loading calendar data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function prevMonth() {
    setSelectedDay(null)
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    setSelectedDay(null)
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  function getEventsForDay(day) {
    return events.filter((e) => e.month === currentMonth && e.day === day)
  }

  function getEventTypesForDay(day) {
    const dayEvents = getEventsForDay(day)
    const types = new Set(dayEvents.map((e) => e.type))
    return [...types]
  }

  const cells = getMonthDays(currentYear, currentMonth)
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : []

  if (loading) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#E0D5C8]/50 rounded w-48 mx-auto" />
            <div className="h-64 bg-[#E0D5C8]/30 rounded-2xl" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-lg mx-auto"
      >
        {/* Title */}
        <h2 className="text-3xl font-serif font-bold text-[#5D4037] text-center mb-6">
          Calendario Familiar
        </h2>

        <div className="bg-white/80 rounded-2xl shadow-md border border-[#E0D5C8]/50 overflow-hidden">
          {/* Month/year header with arrows */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#FAF6F1]">
            <button
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-[#E0D5C8]/40 transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={20} className="text-[#5D4037]" />
            </button>
            <h3 className="text-lg font-serif font-semibold text-[#5D4037]">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-[#E0D5C8]/40 transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={20} className="text-[#5D4037]" />
            </button>
          </div>

          {/* Day names row */}
          <div className="grid grid-cols-7 border-b border-[#E0D5C8]/40">
            {DAY_NAMES.map((name) => (
              <div key={name} className="py-2 text-center text-xs font-semibold text-[#8D6E63] uppercase tracking-wide">
                {name}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              const types = cell.currentMonth ? getEventTypesForDay(cell.day) : []
              const isTodayCell = cell.currentMonth && isToday(cell.day)
              const isSelected = cell.currentMonth && selectedDay === cell.day

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (cell.currentMonth) {
                      setSelectedDay(selectedDay === cell.day ? null : cell.day)
                    }
                  }}
                  className={`
                    relative flex flex-col items-center justify-start py-2 min-h-[3rem]
                    transition-colors text-sm
                    ${cell.currentMonth ? 'hover:bg-[#FAF6F1] cursor-pointer' : 'opacity-30 cursor-default'}
                    ${isSelected ? 'bg-[#FAF6F1]' : ''}
                  `}
                >
                  <span
                    className={`
                      w-7 h-7 flex items-center justify-center rounded-full text-sm leading-none
                      ${isTodayCell ? 'bg-[#C4704B] text-white font-bold' : 'text-[#5D4037]'}
                      ${isSelected && !isTodayCell ? 'ring-2 ring-[#C4704B]/40' : ''}
                    `}
                  >
                    {cell.day}
                  </span>
                  {types.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {types.map((t) => (
                        <span
                          key={t}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: EVENT_COLORS[t] }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-[#E0D5C8]/40 bg-[#FAF6F1]">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EVENT_COLORS.birthday }} />
              <span className="text-xs text-[#8D6E63]">Cumpleaños</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EVENT_COLORS.anniversary }} />
              <span className="text-xs text-[#8D6E63]">Aniversario</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EVENT_COLORS.memorial }} />
              <span className="text-xs text-[#8D6E63]">Memorial</span>
            </div>
          </div>
        </div>

        {/* Selected day events panel */}
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 bg-white/80 rounded-2xl shadow-md border border-[#E0D5C8]/50 overflow-hidden"
          >
            <div className="px-5 py-3 bg-[#FAF6F1] border-b border-[#E0D5C8]/40">
              <h4 className="font-serif font-semibold text-[#5D4037]">
                {selectedDay} de {MONTH_NAMES[currentMonth]}
              </h4>
            </div>
            <div className="px-5 py-3">
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-[#8D6E63] italic">No hay eventos este dia.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedEvents.map((ev, i) => (
                    <li key={i} className="flex items-center gap-3 py-1">
                      <EventIcon type={ev.type} size={18} />
                      <div>
                        <p className="text-sm font-medium text-[#5D4037]">{ev.name}</p>
                        <p className="text-xs" style={{ color: EVENT_COLORS[ev.type] }}>
                          {EVENT_LABELS[ev.type]} — {ev.date}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}
