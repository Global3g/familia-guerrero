import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, MapPin, Calendar, Star, User } from 'lucide-react'
import formatDate from '../utils/formatDate'

function calcAge(birthDate, deathDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const end = deathDate ? new Date(deathDate) : new Date()
  let age = end.getFullYear() - birth.getFullYear()
  const m = end.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--
  return { age, deceased: !!deathDate }
}

export default function PersonProfile({ person, isOpen, onClose }) {
  if (!person) return null
  const ageData = calcAge(person.birthDate, person.deathDate)
  const spouse = person.spouse && typeof person.spouse === 'object' ? person.spouse : null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div className="relative bg-[#1E293B] rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
            <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center">&times;</button>

            {/* Photo header */}
            <div className="h-32 bg-gradient-to-br from-[#B8654A] to-[#B8976A] relative">
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                {person.photoURL ? (
                  <img src={person.photoURL} alt={person.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white/5 border-4 border-white shadow-lg flex items-center justify-center">
                    <User className="w-10 h-10 text-[#B8654A]/40" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-16 pb-6 px-6 text-center">
              <h2 className="text-xl font-serif font-bold text-white">{person.name}</h2>
              {person.nickname && <p className="text-sm text-[#B8654A] italic">"{person.nickname}"</p>}
              {ageData && <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-[#6B9080]/15 text-[#6B9080] font-medium">{ageData.age} años{ageData.deceased ? ' (†)' : ''}</span>}

              <div className="mt-4 space-y-2 text-sm text-white/70">
                {person.birthDate && <p><Calendar className="w-3.5 h-3.5 inline mr-1 text-[#B8976A]" />{formatDate(person.birthDate)}</p>}
                {person.location && <p><MapPin className="w-3.5 h-3.5 inline mr-1 text-[#6B9080]" />{person.location}</p>}
                {spouse && <p><Heart className="w-3.5 h-3.5 inline mr-1 text-[#B8654A]" />Casado/a con {spouse.name}</p>}
              </div>

              {person.bio && <p className="mt-4 text-sm text-white/70 italic leading-relaxed border-t border-white/80 pt-4">{person.bio}</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
