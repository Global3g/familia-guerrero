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

function PhotoAvatar({ photoURL, name, size = 'md', borderColor = '#C4704B' }) {
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
      <section className="py-16 px-4 bg-gradient-to-b from-[#FDF8F0] to-[#FAF6EE]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#C4704B]/10 rounded-lg w-48 mx-auto" />
            <div className="h-32 bg-[#C4704B]/10 rounded-2xl" />
          </div>
        </div>
      </section>
    )
  }

  if (!userName) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-[#FDF8F0] to-[#FAF6EE]">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[#5D4037]/60 text-lg">Inicia sesion para ver tu rama familiar.</p>
        </div>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-[#FDF8F0] to-[#FAF6EE]">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="font-serif text-3xl text-[#5D4037]">Tu Rama</h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 rounded-2xl p-8 shadow-sm border border-[#C4704B]/10"
          >
            <User className="w-12 h-12 text-[#C4704B]/40 mx-auto mb-4" />
            <p className="text-[#5D4037]/70 text-lg">
              No encontramos tu perfil. Asegurate de que tu nombre coincida con el del arbol.
            </p>
            <p className="text-[#5D4037]/40 text-sm mt-2">
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
    <section className="py-16 px-4 bg-gradient-to-b from-[#FDF8F0] to-[#FAF6EE]">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="font-serif text-3xl text-[#5D4037]">Tu Rama</h2>
          <p className="text-[#C4704B] mt-1 text-lg">
            Hola, {firstName}
          </p>
        </motion.div>

        {/* Main profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 rounded-2xl shadow-sm border border-[#C4704B]/10 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#C4704B]/10 to-[#7A9E7E]/10 p-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <PhotoAvatar photoURL={person.photoURL} name={personName} size="lg" />
            <div className="text-center sm:text-left flex-1">
              <h3 className="font-serif text-xl font-bold text-[#5D4037]">{personName}</h3>
              {personAge !== null && (
                <p className="text-[#5D4037]/60 text-sm mt-0.5">{personAge} anios</p>
              )}
              {personLocation && (
                <p className="text-[#7A9E7E] text-sm flex items-center gap-1 justify-center sm:justify-start mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {personLocation}
                </p>
              )}
              {person.bio && (
                <p className="text-[#5D4037]/50 text-sm mt-2 italic">"{person.bio}"</p>
              )}
            </div>
          </div>

          {/* Spouse */}
          {spouse && typeof spouse === 'object' && (
            <div className="px-6 py-4 border-t border-[#C4704B]/10 flex items-center gap-3">
              <Heart className="w-4 h-4 text-[#C4704B] flex-shrink-0" />
              <PhotoAvatar
                photoURL={spouse.photoURL}
                name={spouse.fullName || spouse.name}
                size="sm"
                borderColor="#C4704B"
              />
              <div>
                <p className="text-sm font-semibold text-[#5D4037]">
                  {spouse.fullName || spouse.name}
                </p>
                <p className="text-xs text-[#5D4037]/40">
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
            className="bg-white/90 rounded-2xl shadow-sm border border-[#7A9E7E]/15 p-5"
          >
            <h4 className="font-serif text-lg text-[#5D4037] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#7A9E7E]" />
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
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#FAF6EE] hover:bg-[#F5EFE3] transition-colors"
                  >
                    <PhotoAvatar
                      photoURL={child.photoURL}
                      name={childName}
                      size="sm"
                      borderColor={child.gender === 'F' ? '#C4704B' : '#7A9E7E'}
                    />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#5D4037] leading-tight">{childName}</p>
                      {childAge !== null && (
                        <p className="text-xs text-[#5D4037]/40">{childAge} anios</p>
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
            className="bg-gradient-to-r from-[#B8943E]/10 to-[#C4704B]/10 rounded-2xl p-4 text-center"
          >
            <p className="text-[#5D4037]/60 text-sm">Perteneces a la familia de</p>
            <p className="font-serif text-lg font-bold text-[#5D4037] mt-1">{parentName}</p>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex items-center justify-center gap-2 text-[#5D4037]/50 text-sm"
        >
          <Users className="w-4 h-4" />
          <span>Tu rama tiene <strong className="text-[#5D4037]">{branchCount}</strong> miembros</span>
        </motion.div>

        {/* CTA: complete profile */}
        {missingProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C4704B] text-white rounded-full text-sm font-medium hover:bg-[#A85D3C] transition-colors shadow-sm">
              <Camera className="w-4 h-4" />
              Completar mi perfil
              <ChevronRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-[#5D4037]/30 mt-2">
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
