import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, MapPin, Calendar, Quote, Camera, Pencil } from 'lucide-react'

function calcAge(birthDate, deathDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const end = deathDate ? new Date(deathDate) : new Date()
  let age = end.getFullYear() - birth.getFullYear()
  const m = end.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--
  return { age, deceased: !!deathDate }
}
import { grandparents as defaultGrandparents } from '../data/familyData'
import { getGrandparents, saveGrandparents } from '../firebase/familyService'
import GrandparentForm from './GrandparentForm'

import formatDate from '../utils/formatDate'

const ProfileCard = ({ person, index, onEdit }) => {
  const isGrandfather = index === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, delay: index * 0.3 }}
      className="flex-1 min-w-[300px] max-w-md relative"
    >
      <div
        className="rounded-2xl shadow-lg overflow-hidden border"
        style={{
          backgroundColor: '#FFF8F0',
          borderColor: isGrandfather ? '#C4704B40' : '#7A9E7E40',
        }}
      >
        {/* Edit button */}
        <button
          onClick={onEdit}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-white/80 hover:bg-white shadow-md transition"
          style={{ color: isGrandfather ? '#C4704B' : '#7A9E7E' }}
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Photo */}
        <div className="flex justify-center pt-8 pb-4">
          {(person.photo || person.photoURL) ? (
            <img
              src={person.photoURL || person.photo}
              alt={person.name}
              className="w-40 h-40 rounded-full object-cover shadow-md"
              style={{ border: `4px solid ${isGrandfather ? '#C4704B' : '#7A9E7E'}` }}
            />
          ) : (
            <div
              className="w-40 h-40 rounded-full flex items-center justify-center shadow-md"
              style={{
                background: isGrandfather
                  ? 'linear-gradient(135deg, #C4704B, #B8943E)'
                  : 'linear-gradient(135deg, #7A9E7E, #B8943E)',
                border: `4px solid ${isGrandfather ? '#C4704B' : '#7A9E7E'}`,
              }}
            >
              <Camera className="w-12 h-12 text-white/80" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-6 pb-8 text-center">
          <h3
            className="text-2xl font-serif font-bold mb-1"
            style={{ color: '#5D4037' }}
          >
            {person.name}
            {(() => {
              const r = calcAge(person.birthDate, person.deathDate)
              if (!r) return null
              return (
                <span
                  className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full align-middle"
                  style={{
                    backgroundColor: r.deceased ? '#B8943E20' : '#7A9E7E20',
                    color: r.deceased ? '#B8943E' : '#7A9E7E',
                  }}
                >
                  {r.deceased ? `${r.age} años` : `${r.age} años`}
                </span>
              )
            })()}
          </h3>

          <span
            className="inline-block text-sm font-semibold tracking-wider uppercase mb-4 px-3 py-1 rounded-full"
            style={{
              color: isGrandfather ? '#C4704B' : '#7A9E7E',
              backgroundColor: isGrandfather ? '#C4704B15' : '#7A9E7E15',
            }}
          >
            {person.role}
          </span>

          {/* Birth info */}
          <div className="flex flex-col items-center gap-1 mb-5">
            <div className="flex items-center gap-2 text-sm" style={{ color: '#5D4037CC' }}>
              <Calendar className="w-4 h-4" style={{ color: '#B8943E' }} />
              <span>{formatDate(person.birthDate)}</span>
              {person.deathDate && (
                <>
                  <span className="mx-1">-</span>
                  <span>{formatDate(person.deathDate)}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#5D4037CC' }}>
              <MapPin className="w-4 h-4" style={{ color: '#C4704B' }} />
              <span>{person.birthPlace}</span>
            </div>
          </div>

          {/* Quote */}
          {person.quote && (
            <div
              className="relative mb-5 px-4 py-3 rounded-xl"
              style={{ backgroundColor: '#B8943E10' }}
            >
              <Quote
                className="w-5 h-5 absolute -top-2 left-3"
                style={{ color: '#B8943E' }}
              />
              <p
                className="text-sm italic font-serif leading-relaxed"
                style={{ color: '#5D4037' }}
              >
                {person.quote}
              </p>
            </div>
          )}

          {/* Bio */}
          <p
            className="text-sm leading-relaxed mb-5"
            style={{ color: '#5D4037CC' }}
          >
            {person.bio}
          </p>

          {/* Values */}
          {person.values && person.values.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {person.values.map((value, i) => (
                <span
                  key={i}
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{
                    color: isGrandfather ? '#C4704B' : '#7A9E7E',
                    backgroundColor: isGrandfather ? '#C4704B18' : '#7A9E7E18',
                    border: `1px solid ${isGrandfather ? '#C4704B30' : '#7A9E7E30'}`,
                  }}
                >
                  {value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function Origin() {
  const [data, setData] = useState(null)
  const [editingType, setEditingType] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const firestoreData = await getGrandparents()
    if (firestoreData) {
      setData(firestoreData)
    }
  }

  const grandfather = data?.grandfather || defaultGrandparents.grandfather
  const grandmother = data?.grandmother || defaultGrandparents.grandmother
  const weddingDate = data?.weddingDate || defaultGrandparents.weddingDate
  const weddingPlace = data?.weddingPlace || defaultGrandparents.weddingPlace
  const story = data?.story || defaultGrandparents.story

  const handleSaveGrandparent = async (formData) => {
    const { weddingDate: wd, weddingPlace: wp, story: st, ...personData } = formData
    const updateData = {
      [editingType]: personData,
    }
    if (editingType === 'grandfather' && wd) {
      updateData.weddingDate = wd
      updateData.weddingPlace = wp
      updateData.story = st
    }
    await saveGrandparents(updateData)
    await loadData()
  }

  return (
    <section
      id="origen"
      className="py-20 px-4"
      style={{ backgroundColor: '#FFFBF5' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2
            className="text-4xl md:text-5xl font-serif font-bold mb-4"
            style={{ color: '#5D4037', fontFamily: "'Playfair Display', serif" }}
          >
            Donde Todo Comenzo
          </h2>
          <div
            className="w-24 h-1 mx-auto rounded-full mb-4"
            style={{ backgroundColor: '#B8943E' }}
          />
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#5D4037AA' }}>
            La historia de amor que dio origen a nuestra familia
          </p>
        </motion.div>

        {/* Profile cards */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 mb-16">
          <ProfileCard person={grandfather} index={0} onEdit={() => setEditingType('grandfather')} />

          {/* Heart connector (visible on md+) */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="hidden md:flex items-center justify-center self-center"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-md"
              style={{
                background: 'linear-gradient(135deg, #C4704B, #B8943E)',
              }}
            >
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
          </motion.div>

          <ProfileCard person={grandmother} index={1} onEdit={() => setEditingType('grandmother')} />
        </div>

        {/* Wedding & family story */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div
            className="rounded-2xl shadow-lg p-8 md:p-10 text-center border"
            style={{
              backgroundColor: '#FFF8F0',
              borderColor: '#B8943E30',
            }}
          >
            {/* Wedding heart icon */}
            <div className="flex justify-center mb-5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#C4704B15' }}
              >
                <Heart className="w-7 h-7" style={{ color: '#C4704B', fill: '#C4704B' }} />
              </div>
            </div>

            <h3
              className="text-2xl font-serif font-bold mb-2"
              style={{ color: '#5D4037', fontFamily: "'Playfair Display', serif" }}
            >
              Su Historia de Amor
            </h3>

            {/* Wedding details */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm" style={{ color: '#5D4037CC' }}>
                <Calendar className="w-4 h-4" style={{ color: '#B8943E' }} />
                <span>{formatDate(weddingDate)}</span>
              </div>
              <span className="hidden sm:inline" style={{ color: '#B8943E' }}>|</span>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#5D4037CC' }}>
                <MapPin className="w-4 h-4" style={{ color: '#C4704B' }} />
                <span>{weddingPlace}</span>
              </div>
            </div>

            {/* Story */}
            <p
              className="text-base md:text-lg leading-relaxed font-serif italic"
              style={{ color: '#5D4037' }}
            >
              {story}
            </p>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="w-12 h-px" style={{ backgroundColor: '#B8943E50' }} />
              <Heart className="w-4 h-4" style={{ color: '#B8943E' }} />
              <div className="w-12 h-px" style={{ backgroundColor: '#B8943E50' }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Modals */}
      <GrandparentForm
        isOpen={editingType === 'grandfather'}
        onClose={() => setEditingType(null)}
        grandparentData={{ ...grandfather, weddingDate, weddingPlace, story }}
        type="grandfather"
        onSave={handleSaveGrandparent}
      />
      <GrandparentForm
        isOpen={editingType === 'grandmother'}
        onClose={() => setEditingType(null)}
        grandparentData={grandmother}
        type="grandmother"
        onSave={handleSaveGrandparent}
      />
    </section>
  )
}
