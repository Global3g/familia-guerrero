import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

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

function calcCompletion(people) {
  let totalPoints = 0
  let missingPhotos = 0
  let missingBios = 0
  let missingLocations = 0
  let missingBirthDates = 0
  let missingGender = 0

  people.forEach((p) => {
    let pts = 0
    if (p.name) pts++
    if (p.photo) pts++; else missingPhotos++
    if (p.birthDate) pts++; else missingBirthDates++
    if (p.gender) pts++; else missingGender++
    if (p.bio) pts++; else missingBios++
    if (p.location) pts++; else missingLocations++
    totalPoints += pts
  })

  const maxPoints = people.length * 6
  const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0

  return { percentage, missingPhotos, missingBios, missingLocations, missingBirthDates, missingGender }
}

export default function FamilyProgress() {
  const [data, setData] = useState(null)
  const [totalPeople, setTotalPeople] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [m, gp] = await Promise.all([getFamilyMembers(), getGrandparents()])
    const all = collectAllPeople(m, gp)
    setTotalPeople(all.length)
    setData(calcCompletion(all))
  }

  if (!data || totalPeople === 0) return null

  const missing = []
  if (data.missingPhotos > 0) missing.push(`${data.missingPhotos} fotos`)
  if (data.missingBios > 0) missing.push(`${data.missingBios} biografias`)
  if (data.missingLocations > 0) missing.push(`${data.missingLocations} ubicaciones`)
  if (data.missingBirthDates > 0) missing.push(`${data.missingBirthDates} fechas de nacimiento`)
  if (data.missingGender > 0) missing.push(`${data.missingGender} generos`)

  return (
    <div className="bg-[#7A9E7E]/10 border border-[#7A9E7E]/20 rounded-xl p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#7A9E7E]" />
          <span className="text-sm font-semibold text-[#5D4037]">
            Tu familia esta {data.percentage}% completa
          </span>
        </div>
        <span className="text-xs text-[#5D4037]/50">
          {totalPeople} personas
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 rounded-full bg-[#E0D5C8]/50 overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${data.percentage}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: '#7A9E7E' }}
        />
      </div>

      {/* Missing items */}
      {missing.length > 0 && (
        <p className="text-xs text-[#5D4037]/60">
          Faltan: {missing.join(', ')}
        </p>
      )}
    </div>
  )
}
