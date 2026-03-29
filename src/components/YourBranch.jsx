import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Users, Heart, MapPin, Camera, ChevronRight } from 'lucide-react'
import { auth } from '../firebase/config'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

function normalize(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function findPersonRecursive(members, targetName, parent = null) {
  for (const member of members) {
    const nameMatch =
      normalize(member.fullName || member.name).includes(normalize(targetName)) ||
      normalize(targetName).includes(normalize(member.fullName || member.name))

    if (nameMatch) {
      return { person: member, parent }
    }

    // Check spouse
    if (member.spouse && typeof member.spouse === 'object') {
      const spouseName = member.spouse.fullName || member.spouse.name || ''
      if (
        normalize(spouseName).includes(normalize(targetName)) ||
        normalize(targetName).includes(normalize(spouseName))
      ) {
        return { person: member.spouse, parent, spouseOf: member }
      }
    }

    // Check children recursively
    if (member.children && member.children.length > 0) {
      const found = findPersonRecursive(member.children, targetName, member)
      if (found) return found
    }
  }
  return null
}

function countBranchMembers(person) {
  let count = 1
  if (person.spouse) count++
  if (person.children) {
    for (const child of person.children) {
      count += countBranchMembers(child)
    }
  }
  return count
}

function calculateAge(birthDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function PhotoAvatar({ photoURL, name, size = 'md', borderColor = '#B8654A' }) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  }

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover shadow-md`}
        style={{ border: `3px solid ${borderColor}` }}
      />
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center shadow-md`}
      style={{ backgroundColor: `${borderColor}15`, border: `3px solid ${borderColor}` }}
    >
      <User className={size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12'} style={{ color: borderColor }} />
    </div>
  )
}

export default function YourBranch() {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function load() {
      const user = auth.currentUser
      if (!user || !user.displayName) {
        setLoading(false)
        return
      }

      setUserName(user.displayName)

      const [members, grandparents] = await Promise.all([
        getFamilyMembers(),
        getGrandparents(),
      ])

      // Also check grandparents themselves
      const allTopLevel = [...members]
      const found = findPersonRecursive(allTopLevel, user.displayName)

      if (found) {
        setResult({ ...found, grandparents })
      }

      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#B8654A]/10 rounded-lg w-48 mx-auto" />
            <div className="h-32 bg-[#B8654A]/10 rounded-2xl" />
          </div>
        </div>
      </section>
    )
  }

  if (!userName) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9]">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-white/60 text-lg">Inicia sesion para ver tu rama familiar.</p>
        </div>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9]">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="font-serif text-3xl text-white">Tu Rama</h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-2xl p-8 shadow-sm border-4 border-white/80"
          >
            <User className="w-12 h-12 text-[#B8654A]/40 mx-auto mb-4" />
            <p className="text-white/70 text-lg">
              No encontramos tu perfil. Asegurate de que tu nombre coincida con el del arbol.
            </p>
            <p className="text-white/40 text-sm mt-2">
              Tu nombre actual: <span className="font-semibold">{userName}</span>
            </p>
          </motion.div>
        </div>
      </section>
    )
  }

  const { person, parent, spouseOf, grandparents } = result

  // Determine the "branch head" — if the user is a spouse, the branch head is the member
  const branchHead = spouseOf || person
  const isSpouse = !!spouseOf
  const spouse = isSpouse ? branchHead : branchHead.spouse
  const children = branchHead.children || []
  const parentName = parent
    ? parent.fullName || parent.name
    : grandparents
    ? `${grandparents.grandfather?.fullName || grandparents.grandfather?.name || ''} y ${grandparents.grandmother?.fullName || grandparents.grandmother?.name || ''}`
    : null

  const personName = person.fullName || person.name
  const personAge = calculateAge(person.birthDate)
  const personLocation = person.location || person.city
  const branchCount = countBranchMembers(branchHead)

  const missingProfile = !person.photoURL || !person.bio || !(person.location || person.city)

  const firstName = personName.split(' ')[0]

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9]">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="font-serif text-3xl text-white">Tu Rama</h2>
          <p className="text-[#B8654A] mt-1 text-lg">
            Hola, {firstName}
          </p>
        </motion.div>

        {/* Main profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-2xl shadow-sm border-4 border-white/80 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#B8654A]/10 to-[#6B9080]/10 p-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <PhotoAvatar photoURL={person.photoURL} name={personName} size="lg" />
            <div className="text-center sm:text-left flex-1">
              <h3 className="font-serif text-xl font-bold text-white">{personName}</h3>
              {personAge !== null && (
                <p className="text-white/60 text-sm mt-0.5">{personAge} anios</p>
              )}
              {personLocation && (
                <p className="text-[#6B9080] text-sm flex items-center gap-1 justify-center sm:justify-start mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {personLocation}
                </p>
              )}
              {person.bio && (
                <p className="text-white/50 text-sm mt-2 italic">"{person.bio}"</p>
              )}
            </div>
          </div>

          {/* Spouse */}
          {spouse && typeof spouse === 'object' && (
            <div className="px-6 py-4 border-t border-[#B8654A]/10 flex items-center gap-3">
              <Heart className="w-4 h-4 text-[#B8654A] flex-shrink-0" />
              <PhotoAvatar
                photoURL={spouse.photoURL}
                name={spouse.fullName || spouse.name}
                size="sm"
                borderColor="#B8654A"
              />
              <div>
                <p className="text-sm font-semibold text-white">
                  {spouse.fullName || spouse.name}
                </p>
                <p className="text-xs text-white/40">
                  {isSpouse ? 'Tu' : 'Esposo(a)'}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Children */}
        {children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 rounded-2xl shadow-sm border-4 border-white/80 p-5"
          >
            <h4 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#6B9080]" />
              {isSpouse ? 'Sus' : 'Tus'} hijos ({children.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {children.map((child, i) => {
                const childName = child.fullName || child.name
                const childAge = calculateAge(child.birthDate)
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/5 transition-colors"
                  >
                    <PhotoAvatar
                      photoURL={child.photoURL}
                      name={childName}
                      size="sm"
                      borderColor={child.gender === 'F' ? '#B8654A' : '#6B9080'}
                    />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white leading-tight">{childName}</p>
                      {childAge !== null && (
                        <p className="text-xs text-white/40">{childAge} anios</p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Parent / Branch origin */}
        {parentName && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-[#B8976A]/10 to-[#B8654A]/10 rounded-2xl p-4 text-center"
          >
            <p className="text-white/60 text-sm">Perteneces a la familia de</p>
            <p className="font-serif text-lg font-bold text-white mt-1">{parentName}</p>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex items-center justify-center gap-2 text-white/50 text-sm"
        >
          <Users className="w-4 h-4" />
          <span>Tu rama tiene <strong className="text-white">{branchCount}</strong> miembros</span>
        </motion.div>

        {/* CTA: complete profile */}
        {missingProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B8654A] text-white rounded-full text-sm font-medium hover:bg-[#A85D3C] transition-colors shadow-sm">
              <Camera className="w-4 h-4" />
              Completar mi perfil
              <ChevronRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-white/30 mt-2">
              {!person.photoURL && 'Falta foto. '}
              {!person.bio && 'Falta biografia. '}
              {!(person.location || person.city) && 'Falta ubicacion.'}
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}
