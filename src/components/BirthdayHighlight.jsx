import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Calendar, Cake, PartyPopper, Clock } from 'lucide-react';
import { getFamilyMembers, getGrandparents } from '../firebase/familyService';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function collectAllPeople(members, grandparents) {
  const people = [];

  function walk(list) {
    if (!list || !Array.isArray(list)) return;
    for (const person of list) {
      people.push(person);
      if (person.spouse) {
        if (Array.isArray(person.spouse)) {
          person.spouse.forEach(s => people.push(s));
        } else {
          people.push(person.spouse);
        }
      }
      if (person.spouses && Array.isArray(person.spouses)) {
        person.spouses.forEach(s => people.push(s));
      }
      if (person.children) walk(person.children);
      if (person.members) walk(person.members);
    }
  }

  walk(members);

  if (grandparents && Array.isArray(grandparents)) {
    grandparents.forEach(g => people.push(g));
  } else if (grandparents && typeof grandparents === 'object') {
    Object.values(grandparents).forEach(g => {
      if (g) people.push(g);
    });
  }

  return people;
}

function parseBirthday(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split(/[-/]/);
  if (parts.length < 2) return null;

  let year, month, day;
  if (parts[0].length === 4) {
    year = parseInt(parts[0]);
    month = parseInt(parts[1]);
    day = parseInt(parts[2]) || 1;
  } else {
    day = parseInt(parts[0]);
    month = parseInt(parts[1]);
    year = parts[2] ? parseInt(parts[2]) : null;
  }

  return { year, month, day };
}

function getDaysUntil(month, day) {
  const now = new Date();
  const currentYear = now.getFullYear();
  let target = new Date(currentYear, month - 1, day);

  const today = new Date(currentYear, now.getMonth(), now.getDate());

  if (target < today) {
    target = new Date(currentYear + 1, month - 1, day);
  }

  const diff = target - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function calculateAge(birthYear, birthMonth, birthDay) {
  if (!birthYear) return null;
  const now = new Date();
  let age = now.getFullYear() - birthYear;
  const monthDiff = now.getMonth() + 1 - birthMonth;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDay)) {
    age--;
  }
  return age;
}

function getAgeTurning(birthYear, birthMonth, birthDay) {
  if (!birthYear) return null;
  const now = new Date();
  const thisYearBirthday = new Date(now.getFullYear(), birthMonth - 1, birthDay);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (thisYearBirthday >= today) {
    return now.getFullYear() - birthYear;
  }
  return now.getFullYear() + 1 - birthYear;
}

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.15, duration: 0.5, ease: 'easeOut' }
  })
};

const countdownVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 15 }
  }
};

function BirthdayHighlight() {
  const [birthdayPeople, setBirthdayPeople] = useState([]);
  const [nextBirthday, setNextBirthday] = useState(null);
  const [nextBirthdays, setNextBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentMonthName = MONTH_NAMES[currentMonth - 1];

  useEffect(() => {
    async function loadData() {
      try {
        const [members, grandparents] = await Promise.all([
          getFamilyMembers(),
          getGrandparents()
        ]);

        const allPeople = collectAllPeople(members, grandparents);

        const withBirthdays = allPeople
          .map(p => {
            const bd = parseBirthday(p.birthday || p.birthDate || p.fechaNacimiento);
            if (!bd) return null;
            const daysUntil = getDaysUntil(bd.month, bd.day);
            const ageTurning = getAgeTurning(bd.year, bd.month, bd.day);
            return {
              name: p.name || p.nombre || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
              photo: p.photo || p.photoURL || p.imagen || null,
              month: bd.month,
              day: bd.day,
              year: bd.year,
              daysUntil,
              ageTurning
            };
          })
          .filter(Boolean);

        const thisMonth = withBirthdays
          .filter(p => p.month === currentMonth)
          .sort((a, b) => a.day - b.day);

        setBirthdayPeople(thisMonth);

        const upcoming = withBirthdays
          .filter(p => p.daysUntil > 0)
          .sort((a, b) => a.daysUntil - b.daysUntil);

        if (upcoming.length > 0) {
          setNextBirthday(upcoming[0]);
          setNextBirthdays(upcoming.slice(0, 3));
        }
      } catch (err) {
        console.error('Error loading birthday data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentMonth]);

  if (loading) {
    return (
      <section id="cumpleanos" className="py-16" style={{ backgroundColor: '#152238' }}>
        <div className="max-w-[1600px] mx-auto px-4 text-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-10 w-64 bg-white/10 rounded-lg" />
            <div className="h-48 w-full max-w-md bg-white/5 rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="cumpleanos" className="py-32" style={{ backgroundColor: '#152238' }}>
      <div className="max-w-[1600px] mx-auto px-4">
        {/* Title */}
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
          <p className="elegant-caps text-white/60 mb-6">Celebraciones</p>
          <h2 className="elegant-heading text-5xl sm:text-6xl md:text-7xl italic text-white mb-6" style={{ letterSpacing: '-0.02em' }}>
            Cumpleañeros del Mes
          </h2>
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-accent/30" />
            <svg width="8" height="8" viewBox="0 0 8 8" className="text-accent/40">
              <circle cx="4" cy="4" r="2" fill="currentColor" />
            </svg>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-accent/30" />
          </div>
          <p className="elegant-subheading text-2xl text-accent/80">
            {currentMonthName} {now.getFullYear()}
          </p>
        </motion.div>

        {/* Birthday Cards */}
        {birthdayPeople.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {birthdayPeople.map((person, i) => (
              <motion.div
                key={`${person.name}-${person.day}`}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                className="glass-panel rounded-3xl overflow-hidden relative"
              >
                {/* Card top accent */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60" />

                <div className="p-6 text-center">
                  {/* Confetti decorations */}
                  <div className="relative">
                    <PartyPopper
                      size={20}
                      className="absolute -top-1 left-4"
                      style={{ color: '#B8976A', transform: 'rotate(-30deg)' }}
                    />
                    <PartyPopper
                      size={20}
                      className="absolute -top-1 right-4"
                      style={{ color: '#C8846A', transform: 'rotate(30deg)' }}
                    />

                    {/* Photo placeholder */}
                    <div
                      className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 shadow-md"
                      style={{
                        background: person.photo
                          ? `url(${person.photo}) center/cover`
                          : 'linear-gradient(135deg, #B8963E, #C8846A)',
                        border: '3px solid #B8976A'
                      }}
                    >
                      {!person.photo && (
                        <Cake size={36} color="white" />
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="elegant-heading text-2xl text-white mb-2">
                    {person.name}
                  </h3>

                  {/* Date - Big day number */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Calendar size={18} style={{ color: '#B8976A' }} />
                    <span className="text-3xl font-bold font-serif" style={{ color: '#B8976A' }}>
                      {person.day}
                    </span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      de {currentMonthName}
                    </span>
                  </div>

                  {/* Age turning */}
                  {person.ageTurning && (
                    <p className="text-sm mb-3 text-secondary/90 font-medium">
                      <Gift size={14} className="inline mr-1" />
                      Cumple <span className="elegant-heading text-lg">{person.ageTurning}</span> años
                    </p>
                  )}

                  {/* Countdown if not yet */}
                  {person.daysUntil > 0 && (
                    <motion.div
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={countdownVariants}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                      style={{ background: 'rgba(196, 112, 75, 0.15)' }}
                    >
                      <Clock size={16} style={{ color: '#B8963E' }} />
                      <span className="text-sm" style={{ color: '#B8963E' }}>
                        Faltan{' '}
                        <motion.span
                          className="font-bold text-lg"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          {person.daysUntil}
                        </motion.span>
                        {' '}dias
                      </span>
                    </motion.div>
                  )}

                  {person.daysUntil === 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                      style={{ background: 'linear-gradient(135deg, #B8963E, #C8846A)', color: 'white' }}
                    >
                      <Cake size={16} />
                      <span className="font-bold">¡Hoy es su cumpleaños!</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 py-8"
          >
            <Cake size={48} className="mx-auto mb-4 text-primary/40" />
            <p className="elegant-subheading text-xl text-white/40">
              No hay cumpleaños este mes
            </p>
          </motion.div>
        )}

        {/* Next upcoming birthday */}
        {nextBirthday && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-lg mx-auto"
          >
            <div className="glass-panel rounded-3xl overflow-hidden relative">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary via-accent to-secondary opacity-60" />

              <div className="p-10 text-center">
                <h3 className="elegant-heading text-xl text-secondary mb-6">
                  <Gift size={20} className="inline mr-2" />
                  Próximo Cumpleaños
                </h3>

                {/* Photo placeholder */}
                <div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-lg ring-2 ring-secondary/20"
                  style={{
                    background: nextBirthday.photo
                      ? `url(${nextBirthday.photo}) center/cover`
                      : 'linear-gradient(135deg, #6B9080, #B8976A)',
                    border: '3px solid #6B9080'
                  }}
                >
                  {!nextBirthday.photo && (
                    <Gift size={28} color="white" />
                  )}
                </div>

                <p className="elegant-heading text-2xl text-white mb-2">
                  {nextBirthday.name}
                </p>

                <p className="text-sm mb-6 text-white/50 font-medium">
                  {nextBirthday.day} de {MONTH_NAMES[nextBirthday.month - 1]}
                  {nextBirthday.ageTurning && ` - Cumplirá ${nextBirthday.ageTurning} años`}
                </p>

                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={countdownVariants}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-secondary/10 border border-secondary/20"
                >
                  <Clock size={18} className="text-secondary" />
                  <span className="text-secondary font-medium">
                    Faltan{' '}
                    <motion.span
                      className="elegant-heading text-2xl text-accent"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      {nextBirthday.daysUntil}
                    </motion.span>
                    {' '}días
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Next 3 upcoming birthdays across all months */}
        {nextBirthdays.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-lg mx-auto mt-8"
          >
            <h3 className="elegant-heading text-xl text-accent text-center mb-6">
              <Calendar size={18} className="inline mr-2" />
              Próximos Cumpleaños
            </h3>
            <div className="space-y-3">
              {nextBirthdays.map((person, i) => (
                <motion.div
                  key={`${person.name}-upcoming-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="glass-panel rounded-2xl flex items-center gap-4 px-5 py-4"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-accent/10"
                    style={{
                      background: person.photo
                        ? `url(${person.photo}) center/cover`
                        : 'linear-gradient(135deg, #B8963E, #C8846A)',
                      border: '2px solid #B8976A'
                    }}
                  >
                    {!person.photo && <Cake size={18} color="white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="elegant-heading text-base text-white truncate">
                      {person.name}
                    </p>
                    <p className="text-xs text-white/50 font-medium">
                      {person.day} de {MONTH_NAMES[person.month - 1]}
                      {person.ageTurning ? ` - Cumple ${person.ageTurning} años` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="elegant-heading text-xl text-accent">{person.daysUntil}</p>
                    <p className="elegant-caps text-white/40">días</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default BirthdayHighlight;
