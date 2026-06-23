import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MapPin, Calendar, Quote, Camera, Pencil, BookOpen, X } from 'lucide-react'

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
import { getGrandparents, saveGrandparents, getGalleryPhotos } from '../firebase/familyService'
import { useAuth } from '../firebase/useAuth'
import GrandparentForm from './GrandparentForm'
import formatDate from '../utils/formatDate'
import DeceasedCross from '../utils/DeceasedCross'

// ponytail: compact card, bio goes to modal
const CompactCard = ({ person, index, onEdit, isAdmin, onReadBio }) => {
  const isGrandfather = index === 0
  const accent = isGrandfather ? '#B8963E' : '#6B9080'

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, delay: index * 0.3 }}
      className="flex-1 min-w-[300px] max-w-md relative"
    >
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '2px solid rgba(184,150,62,0.3)' }}>
        {isAdmin && (
          <button
            onClick={onEdit}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 shadow-md transition"
            style={{ color: accent }}
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}

        {/* Photo */}
        <div className="flex justify-center pt-8 pb-4">
          {(person.photo || person.photoURL) ? (
            <img
              src={person.photoURL || person.photo}
              alt={person.name}
              className="w-36 h-36 rounded-full object-cover shadow-lg"
              style={{ border: `4px solid ${accent}` }}
            />
          ) : (
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${accent}, #B8976A)`,
                border: `4px solid ${accent}`,
              }}
            >
              <Camera className="w-12 h-12 text-white/80" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-6 pb-8 text-center">
          <h3 className="text-2xl font-serif font-bold mb-1 text-white italic">
            {person.name}<DeceasedCross deathDate={person.deathDate} />
            {(() => {
              const r = calcAge(person.birthDate, person.deathDate)
              if (!r) return null
              return (
                <span
                  className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full align-middle not-italic"
                  style={{ backgroundColor: `${accent}20`, color: accent }}
                >
                  {r.age} años
                </span>
              )
            })()}
          </h3>

          {person.nickname && (
            <p className="text-base font-medium italic mb-2" style={{ color: accent }}>
              "{person.nickname}"
            </p>
          )}

          <span
            className="inline-block text-xs font-semibold tracking-wider uppercase mb-4 px-3 py-1 rounded-full"
            style={{ color: accent, backgroundColor: `${accent}15` }}
          >
            {person.role}
          </span>

          {/* Dates compact */}
          <div className="flex flex-col items-center gap-1 mb-4 text-sm">
            <div className="flex items-center gap-2 text-white/70">
              <Calendar className="w-4 h-4" style={{ color: '#B8976A' }} />
              <span>{formatDate(person.birthDate)}</span>
              {person.deathDate && (
                <>
                  <span>—</span>
                  <span>{formatDate(person.deathDate)}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <MapPin className="w-4 h-4" style={{ color: accent }} />
              <span>{person.birthPlace}</span>
            </div>
          </div>

          {/* Quote */}
          {person.quote && (
            <div className="relative mb-4 px-4 py-3 rounded-xl" style={{ backgroundColor: '#B8976A10' }}>
              <Quote className="w-4 h-4 absolute -top-2 left-3" style={{ color: '#B8976A' }} />
              <p className="text-sm italic font-serif leading-relaxed text-white/80">
                {person.quote}
              </p>
            </div>
          )}

          {/* Values */}
          {person.values && person.values.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {person.values.map((value, i) => (
                <span
                  key={i}
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                  style={{ color: accent, backgroundColor: `${accent}18`, border: `1px solid ${accent}30` }}
                >
                  {value}
                </span>
              ))}
            </div>
          )}

          {/* Read bio button */}
          <button
            onClick={() => onReadBio(person, isGrandfather)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
            style={{ backgroundColor: accent, color: 'white' }}
          >
            <BookOpen className="w-4 h-4" />
            Leer biografía completa
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ponytail: fullscreen bio modal with photo collage background
const BioModal = ({ person, isGrandfather, isOpen, onClose, photos }) => {
  if (!isOpen || !person) return null
  const accent = isGrandfather ? '#B8963E' : '#6B9080'

  // Split bio into paragraphs
  const paragraphs = (person.bio || '').split(/\n+/).filter(Boolean)
  // If it's one giant block, split by sentences into chunks of ~3 sentences
  const formatBio = (text) => {
    if (paragraphs.length > 1) return paragraphs
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    const chunks = []
    for (let i = 0; i < sentences.length; i += 3) {
      chunks.push(sentences.slice(i, i + 3).join(' ').trim())
    }
    return chunks
  }

  const bioChunks = formatBio(person.bio || '')

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background */}
          <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
            {/* Photo collage background - person specific */}
            {photos.length > 0 && (
              <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 grid grid-cols-3 md:grid-cols-4 gap-2 p-2 content-start">
                  {photos.slice(0, 16).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="w-full aspect-square object-cover rounded-xl"
                      style={{ opacity: 0.35 }}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 bg-[#F5F0E8]/25" />
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="fixed top-6 right-6 z-[110] w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: 'rgba(0,0,0,0.05)', border: `1px solid ${accent}40` }}
            >
              <X className="w-6 h-6" style={{ color: '#1C1C1C' }} />
            </button>

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-20">
              {/* Header */}
              <div className="text-center mb-12">
                {(person.photo || person.photoURL) ? (
                  <img
                    src={person.photoURL || person.photo}
                    alt={person.name}
                    className="w-44 h-44 rounded-full object-cover shadow-2xl mx-auto mb-6"
                    style={{ border: `4px solid ${accent}` }}
                  />
                ) : (
                  <div
                    className="w-44 h-44 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6"
                    style={{ background: `linear-gradient(135deg, ${accent}, #B8976A)`, border: `4px solid ${accent}` }}
                  >
                    <Camera className="w-16 h-16 text-white/80" />
                  </div>
                )}

                <p className="text-xs font-sans tracking-[6px] uppercase mb-2" style={{ color: accent }}>
                  {person.role}
                </p>
                <h1 className="font-serif text-4xl md:text-5xl font-bold italic mb-2" style={{ color: '#1C1C1C' }}>
                  {person.name}<DeceasedCross deathDate={person.deathDate} />
                </h1>
                {person.nickname && (
                  <p className="text-xl italic mb-3" style={{ color: accent }}>"{person.nickname}"</p>
                )}

                {/* Dates */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm" style={{ color: '#4A4A4A' }}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: '#B8976A' }} />
                    <span>{formatDate(person.birthDate)}</span>
                    {person.deathDate && (
                      <>
                        <span>—</span>
                        <span>{formatDate(person.deathDate)}</span>
                      </>
                    )}
                  </div>
                  <span className="hidden sm:inline" style={{ color: accent }}>·</span>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" style={{ color: accent }} />
                    <span>{person.birthPlace}</span>
                  </div>
                </div>

                {/* Decorative divider */}
                <div className="flex items-center justify-center gap-3 mt-8">
                  <div className="w-16 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
                  <span style={{ color: accent, fontSize: '14px' }}>❦</span>
                  <div className="w-16 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
                </div>
              </div>

              {/* Quote */}
              {person.quote && (
                <div className="text-center mb-12 px-4">
                  <Quote className="w-8 h-8 mx-auto mb-3" style={{ color: '#B8976A40' }} />
                  <p className="font-serif text-2xl italic leading-relaxed max-w-xl mx-auto" style={{ color: '#4A4A4A' }}>
                    {person.quote}
                  </p>
                </div>
              )}

              {/* Biography — storybook style */}
              <div className="space-y-7 mb-16">
                {bioChunks.map((chunk, i) => (
                  <p key={i} className="font-sans text-lg md:text-xl leading-[1.9] font-light" style={{ color: '#2A2A2A', textIndent: i > 0 ? '2em' : 0 }}>
                    {i === 0 && <span className="font-serif text-5xl float-left mr-3 mt-1 leading-[0.8]" style={{ color: accent }}>{chunk[0]}</span>}
                    {i === 0 ? chunk.slice(1) : chunk}
                  </p>
                ))}
              </div>

              {/* Values */}
              {person.values && person.values.length > 0 && (
                <div className="text-center mb-12">
                  <p className="text-xs tracking-[4px] uppercase mb-4" style={{ color: accent }}>Valores</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {person.values.map((value, i) => (
                      <span
                        key={i}
                        className="text-sm font-medium px-4 py-2 rounded-full"
                        style={{ color: accent, backgroundColor: `${accent}15`, border: `1px solid ${accent}30` }}
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Back button */}
              <div className="text-center">
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{ backgroundColor: accent, color: 'white' }}
                >
                  Volver al árbol
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Origin() {
  const { isAdmin } = useAuth()
  const [data, setData] = useState(null)
  const [editingType, setEditingType] = useState(null)
  const [bioModal, setBioModal] = useState({ isOpen: false, person: null, isGrandfather: false })
  const [loveStoryOpen, setLoveStoryOpen] = useState(false)
  const [photosByCategory, setPhotosByCategory] = useState({ pepe: [], licha: [], juntos: [] })

  useEffect(() => {
    loadData()
    loadPhotos()
  }, [])

  const loadData = async () => {
    const firestoreData = await getGrandparents()
    if (firestoreData) setData(firestoreData)
  }

  const loadPhotos = async () => {
    try {
      const gallery = await getGalleryPhotos()
      const pepe = gallery.filter(p => p.category === 'abuelo-pepe').map(p => p.photoURL).filter(Boolean)
      const licha = gallery.filter(p => p.category === 'abuela-licha').map(p => p.photoURL).filter(Boolean)
      const juntos = gallery.filter(p => p.category === 'abuelos-juntos' || p.category === 'abuelos').map(p => p.photoURL).filter(Boolean)
      setPhotosByCategory({ pepe, licha, juntos })
    } catch (e) {
      // no photos, no problem
    }
  }

  const grandfather = data?.grandfather || defaultGrandparents.grandfather
  const grandmother = data?.grandmother || defaultGrandparents.grandmother
  const weddingDate = data?.weddingDate || defaultGrandparents.weddingDate
  const weddingPlace = data?.weddingPlace || defaultGrandparents.weddingPlace
  const story = data?.story || defaultGrandparents.story

  const handleSaveGrandparent = async (formData) => {
    const { weddingDate: wd, weddingPlace: wp, story: st, ...personData } = formData
    const updateData = { [editingType]: personData }
    if (editingType === 'grandfather' && wd) {
      updateData.weddingDate = wd
      updateData.weddingPlace = wp
      updateData.story = st
    }
    await saveGrandparents(updateData)
    await loadData()
  }

  const openBio = (person, isGrandfather) => {
    setBioModal({ isOpen: true, person, isGrandfather })
    document.body.style.overflow = 'hidden'
  }

  const closeBio = () => {
    setBioModal({ isOpen: false, person: null, isGrandfather: false })
    document.body.style.overflow = ''
  }

  const openLoveStory = () => {
    setLoveStoryOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLoveStory = () => {
    setLoveStoryOpen(false)
    document.body.style.overflow = ''
  }

  return (
    <section
      id="origen"
      className="py-24 px-4"
      style={{ backgroundColor: '#152238' }}
    >
      <div className="mx-auto px-4 lg:px-12">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-[6px] uppercase mb-4" style={{ color: '#B8963E' }}>Nuestro origen</p>
          <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl text-white italic mb-4" style={{ fontWeight: 400 }}>
            Donde Todo Comenzó
          </h2>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, transparent, #B8963E, transparent)' }} />
            <span style={{ color: '#B8963E', fontSize: '14px' }}>❦</span>
            <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, transparent, #B8963E, transparent)' }} />
          </div>
          <p className="font-serif italic text-xl text-white/40 max-w-2xl mx-auto">
            El amor que nos dio vida a todos
          </p>
        </motion.div>

        {/* Compact profile cards */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 mb-16 max-w-4xl mx-auto">
          <CompactCard person={grandfather} index={0} onEdit={() => setEditingType('grandfather')} isAdmin={isAdmin} onReadBio={openBio} />

          {/* Heart connector */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="hidden md:flex items-center justify-center self-center"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #B8963E, #B8976A)' }}
            >
              <Heart className="w-7 h-7 text-white fill-white" />
            </div>
          </motion.div>

          <CompactCard person={grandmother} index={1} onEdit={() => setEditingType('grandmother')} isAdmin={isAdmin} onReadBio={openBio} />
        </div>

        {/* Wedding — compact card with button */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-md mx-auto"
        >
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '2px solid rgba(184,150,62,0.3)' }}>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#B8963E15' }}>
                <Heart className="w-6 h-6" style={{ color: '#B8963E', fill: '#B8963E' }} />
              </div>
            </div>

            <h3 className="text-2xl font-serif font-bold italic mb-2 text-white">
              Su Historia de Amor
            </h3>
            {weddingDate && (
              <p className="text-sm font-medium tracking-wide mb-3" style={{ color: '#B8976A' }}>
                Juntos desde {new Date(weddingDate).getFullYear()}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5 text-sm">
              <div className="flex items-center gap-2 text-white/70">
                <Calendar className="w-4 h-4" style={{ color: '#B8976A' }} />
                <span>{formatDate(weddingDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <MapPin className="w-4 h-4" style={{ color: '#B8963E' }} />
                <span>{weddingPlace}</span>
              </div>
            </div>

            <button
              onClick={openLoveStory}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
              style={{ backgroundColor: '#7A2841', color: 'white' }}
            >
              <Heart className="w-4 h-4" />
              Leer su historia de amor
            </button>
          </div>
        </motion.div>
      </div>

      {/* Love Story Modal */}
      <AnimatePresence>
        {loveStoryOpen && (
          <motion.div
            className="fixed inset-0 z-[100] overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
              {/* Photo collage background */}
              {photosByCategory.juntos.length > 0 && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 grid grid-cols-3 md:grid-cols-4 gap-2 p-2 content-start">
                    {photosByCategory.juntos.slice(0, 16).map((url, i) => (
                      <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-xl" style={{ opacity: 0.35 }} />
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-[#F5F0E8]/25" />
                </div>
              )}

              {/* Close */}
              <button
                onClick={closeLoveStory}
                className="fixed top-6 right-6 z-[110] w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid #7A284140' }}
              >
                <X className="w-6 h-6" style={{ color: '#1C1C1C' }} />
              </button>

              <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-20">
                {/* Both photos side by side */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  {(grandfather.photo || grandfather.photoURL) && (
                    <img
                      src={grandfather.photoURL || grandfather.photo}
                      alt={grandfather.name}
                      className="w-40 h-40 md:w-44 md:h-44 rounded-full object-cover shadow-xl"
                      style={{ border: '4px solid #B8963E' }}
                    />
                  )}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7A2841, #B8963E)' }}>
                    <Heart className="w-6 h-6 text-white fill-white" />
                  </div>
                  {(grandmother.photo || grandmother.photoURL) && (
                    <img
                      src={grandmother.photoURL || grandmother.photo}
                      alt={grandmother.name}
                      className="w-40 h-40 md:w-44 md:h-44 rounded-full object-cover shadow-xl"
                      style={{ border: '4px solid #6B9080' }}
                    />
                  )}
                </div>

                {/* Title */}
                <div className="text-center mb-12">
                  <p className="text-xs tracking-[6px] uppercase mb-3" style={{ color: '#7A2841' }}>Historia de Amor</p>
                  <h1 className="font-serif text-4xl md:text-5xl font-bold italic mb-2" style={{ color: '#1C1C1C' }}>
                    {grandfather.name?.split(' ')[0]} & {grandmother.name?.split(' ')[0]}
                  </h1>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm mt-4" style={{ color: '#4A4A4A' }}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" style={{ color: '#B8976A' }} />
                      <span>{formatDate(weddingDate)}</span>
                    </div>
                    <span className="hidden sm:inline" style={{ color: '#7A2841' }}>·</span>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" style={{ color: '#7A2841' }} />
                      <span>{weddingPlace}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 mt-8">
                    <div className="w-16 h-px" style={{ background: 'linear-gradient(90deg, transparent, #7A2841, transparent)' }} />
                    <Heart className="w-4 h-4" style={{ color: '#7A2841', fill: '#7A2841' }} />
                    <div className="w-16 h-px" style={{ background: 'linear-gradient(90deg, transparent, #7A2841, transparent)' }} />
                  </div>
                </div>

                {/* Story */}
                <div className="space-y-7 mb-16">
                  {(() => {
                    const text = story || ''
                    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
                    const chunks = []
                    for (let i = 0; i < sentences.length; i += 3) {
                      chunks.push(sentences.slice(i, i + 3).join(' ').trim())
                    }
                    return chunks.map((chunk, i) => (
                      <p key={i} className="font-sans text-lg md:text-xl leading-[1.9] font-light" style={{ color: '#2A2A2A', textIndent: i > 0 ? '2em' : 0 }}>
                        {i === 0 && <span className="font-serif text-5xl float-left mr-3 mt-1 leading-[0.8]" style={{ color: '#7A2841' }}>{chunk[0]}</span>}
                        {i === 0 ? chunk.slice(1) : chunk}
                      </p>
                    ))
                  })()}
                </div>

                {/* Back */}
                <div className="text-center">
                  <button
                    onClick={closeLoveStory}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: '#7A2841', color: 'white' }}
                  >
                    Volver al árbol
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bio Modal */}
      <BioModal
        person={bioModal.person}
        isGrandfather={bioModal.isGrandfather}
        isOpen={bioModal.isOpen}
        onClose={closeBio}
        photos={bioModal.isGrandfather ? photosByCategory.pepe : photosByCategory.licha}
      />

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
