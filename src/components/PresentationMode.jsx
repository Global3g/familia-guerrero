import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, X, ChevronLeft, ChevronRight, Maximize } from 'lucide-react'
import { getFamilyMembers, getGrandparents, getGalleryPhotos } from '../firebase/familyService'

// ── Helpers ────────────────────────────────────────────────────

function shuffleArray(arr) {
  const s = [...arr]
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]]
  }
  return s
}

function getLastName(fullName) {
  if (!fullName) return ''
  const parts = fullName.trim().split(' ')
  return parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1]
}

function getNucleusTitle(member) {
  const sp = member.spouse
  const spName = sp ? (typeof sp === 'object' ? sp.name : sp) : null
  const memberLast = member.lastName || getLastName(member.name || member.fullName)
  const spouseLast = sp && typeof sp === 'object' && sp.lastName ? sp.lastName : (spName ? getLastName(spName) : null)
  if (!spouseLast) return `Familia ${memberLast}`
  if (member.gender === 'M') return `Familia ${memberLast} ${spouseLast}`
  if (member.gender === 'F') return `Familia ${spouseLast} ${memberLast}`
  return `Familia ${memberLast} ${spouseLast}`
}

function countDescendants(member) {
  let count = 0
  const walk = (children) => {
    (children || []).filter(c => c).forEach(c => {
      count++
      if (c.spouse && typeof c.spouse === 'object') count++
      if (c.children) walk(c.children)
    })
  }
  walk(member.children)
  return count
}

// ── Slide transitions ──
const transitions = [
  { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.1 } },
  { initial: { opacity: 0, x: 100 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -100 } },
  { initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -60 } },
  { initial: { opacity: 0, rotateY: 15 }, animate: { opacity: 1, rotateY: 0 }, exit: { opacity: 0, rotateY: -15 } },
]

function buildSlides(members, galleryPhotos, grandparents) {
  const slides = []

  // Count total
  let totalPeople = 0
  const countAll = (p) => {
    if (!p) return
    totalPeople++
    if (p.spouse && typeof p.spouse === 'object' && p.spouse.name) totalPeople++
    if (p.children) p.children.filter(c => c).forEach(countAll)
  }
  if (grandparents?.grandfather) totalPeople++
  if (grandparents?.grandmother) totalPeople++
  members.forEach(countAll)

  // 1. Title
  slides.push({ type: 'title', title: 'Familia Guerrero', subtitle: `${totalPeople} miembros · ${members.length} nucleos familiares` })

  // 2. Grandparents together
  if (grandparents) {
    const gf = grandparents.grandfather
    const gm = grandparents.grandmother
    slides.push({
      type: 'founders',
      grandfather: gf ? { name: gf.fullName || gf.name, photo: gf.photoURL, nickname: gf.nickname, deceased: !!gf.deathDate } : null,
      grandmother: gm ? { name: gm.fullName || gm.name, photo: gm.photoURL, nickname: gm.nickname, deceased: !!gm.deathDate } : null,
      story: grandparents.story || '',
      weddingDate: grandparents.weddingDate || '',
      weddingPlace: grandparents.weddingPlace || '',
    })
  }

  // 3. One slide per nucleus (sorted by birthDate)
  const sorted = [...members].sort((a, b) => {
    if (!a.birthDate && !b.birthDate) return 0
    if (!a.birthDate) return 1
    if (!b.birthDate) return -1
    return a.birthDate.localeCompare(b.birthDate)
  })

  sorted.forEach(member => {
    const sp = member.spouse
    const spObj = sp && typeof sp === 'object' ? sp : null
    const childNames = (member.children || []).filter(c => c).map(c => {
      const name = (c.name || '').split(' ')[0]
      return c.deathDate ? `${name} ✝` : name
    })

    slides.push({
      type: 'nucleus',
      title: getNucleusTitle(member),
      member: {
        name: member.name || '',
        photo: member.photoURL || null,
        nickname: member.nickname || '',
        deceased: !!member.deathDate,
      },
      spouse: spObj ? {
        name: spObj.name || '',
        photo: spObj.photoURL || null,
        nickname: spObj.nickname || '',
        deceased: !!spObj.deathDate,
      } : null,
      childNames,
      descendantCount: countDescendants(member),
    })
  })

  // 4. Random gallery photos (max 6)
  const withPhotos = galleryPhotos.filter(p => p.photoURL)
  const picked = shuffleArray(withPhotos).slice(0, 6)
  picked.forEach(p => {
    slides.push({ type: 'photo', photo: p.photoURL, caption: p.caption || '', year: p.year || null })
  })

  // 5. Closing slide
  slides.push({ type: 'closing', text: 'No se van del todo quienes dejan huella en el corazon.' })

  return slides
}

// ── PresentationMode ──────────────────────────────────────────

function PresentationMode({ isOpen, onClose }) {
  const [slides, setSlides] = useState([])
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [loading, setLoading] = useState(true)
  const [controlsVisible, setControlsVisible] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const [members, grandparents, gallery] = await Promise.all([
        getFamilyMembers(), getGrandparents(), getGalleryPhotos(),
      ])
      if (cancelled) return
      setSlides(buildSlides(members, gallery, grandparents))
      setCurrent(0)
      setPlaying(true)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [isOpen])

  // Auto-advance (7s per slide)
  useEffect(() => {
    if (!playing || slides.length === 0) return
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [playing, slides.length])

  // Auto-hide controls
  useEffect(() => {
    if (!isOpen) return
    let t = setTimeout(() => setControlsVisible(false), 3000)
    const show = () => { setControlsVisible(true); clearTimeout(t); t = setTimeout(() => setControlsVisible(false), 3000) }
    window.addEventListener('mousemove', show)
    window.addEventListener('touchstart', show)
    return () => { clearTimeout(t); window.removeEventListener('mousemove', show); window.removeEventListener('touchstart', show) }
  }, [isOpen])

  const goNext = useCallback(() => setCurrent(p => (p + 1) % Math.max(slides.length, 1)), [slides.length])
  const goPrev = useCallback(() => setCurrent(p => (p - 1 + slides.length) % Math.max(slides.length, 1)), [slides.length])

  // Keyboard
  useEffect(() => {
    if (!isOpen) return
    const h = (e) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p) }
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, goNext, goPrev, onClose])

  if (!isOpen) return null

  const slide = slides[current]
  const trans = transitions[current % transitions.length]

  // Person circle helper
  const PersonCircle = ({ name, photo, deceased, size = 'lg', nickname }) => {
    const sizes = { md: 'w-20 h-20', lg: 'w-36 h-36 md:w-44 md:h-44', xl: 'w-48 h-48 md:w-56 md:h-56' }
    return (
      <div className="flex flex-col items-center">
        <div className={`${sizes[size]} rounded-full overflow-hidden shadow-2xl ${deceased ? 'border-3 border-[#B8976A]/50' : 'border-3 border-white/20'}`}>
          {photo ? (
            <img src={photo} alt={name} className={`w-full h-full object-cover ${deceased ? 'grayscale opacity-80' : ''}`} />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <span className="text-4xl text-white/40">{name?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
        </div>
        <p className="mt-2 text-white font-serif font-bold text-sm md:text-base text-center">
          {name?.split(' ').slice(0, 2).join(' ')}
          {deceased && <span className="ml-1 text-[#D4A843]">✝</span>}
        </p>
        {nickname && <p className="text-white/40 italic text-xs">"{nickname}"</p>}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center overflow-hidden">
      {loading && (
        <div className="text-white text-xl font-light animate-pulse">Cargando presentacion...</div>
      )}

      {!loading && slides.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={trans.initial}
            animate={trans.animate}
            exit={trans.exit}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* ── Title ── */}
            {slide.type === 'title' && (
              <div className="flex flex-col items-center text-center px-8">
                <motion.h1
                  className="text-6xl md:text-8xl font-serif font-bold text-white mb-4"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  {slide.title}
                </motion.h1>
                <motion.div
                  className="w-20 h-[2px] bg-[#B8963E] mx-auto mb-5"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                />
                <motion.p
                  className="text-xl md:text-2xl text-white/60 font-light"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  {slide.subtitle}
                </motion.p>
              </div>
            )}

            {/* ── Founders (Grandparents together) ── */}
            {slide.type === 'founders' && (
              <div className="flex flex-col items-center text-center px-8 max-w-3xl">
                <div className="flex items-center gap-6 md:gap-10 mb-6">
                  {slide.grandfather && <PersonCircle {...slide.grandfather} size="xl" />}
                  <div className="text-4xl">❤️</div>
                  {slide.grandmother && <PersonCircle {...slide.grandmother} size="xl" />}
                </div>
                {(slide.weddingDate || slide.weddingPlace) && (
                  <p className="text-[#B8976A] text-sm font-medium mb-3">
                    {slide.weddingDate}{slide.weddingDate && slide.weddingPlace && ' · '}{slide.weddingPlace}
                  </p>
                )}
                {slide.story && (
                  <p className="text-white/50 text-base md:text-lg leading-relaxed line-clamp-4 max-w-xl">
                    {slide.story}
                  </p>
                )}
              </div>
            )}

            {/* ── Nucleus (family group) ── */}
            {slide.type === 'nucleus' && (
              <>
                {/* Blurred bg from member photo */}
                {(slide.member.photo || slide.spouse?.photo) && (
                  <img
                    src={slide.member.photo || slide.spouse?.photo}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'blur(30px) brightness(0.2) saturate(0.5)' }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
                  {/* Family title */}
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">{slide.title}</h2>

                  {/* Parents */}
                  <div className="flex items-center gap-6 md:gap-8 mb-6">
                    <PersonCircle {...slide.member} size="lg" />
                    {slide.spouse && (
                      <>
                        <div className="text-2xl text-white/30">&</div>
                        <PersonCircle {...slide.spouse} size="lg" />
                      </>
                    )}
                  </div>

                  {/* Children names */}
                  {slide.childNames.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[11px] uppercase tracking-[3px] text-white/30 mb-2">
                        {slide.childNames.length === 1 ? 'Hijo' : 'Hijos'}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {slide.childNames.map((name, i) => (
                          <span key={i} className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-sm font-medium">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Descendant count */}
                  {slide.descendantCount > 0 && (
                    <p className="mt-4 text-xs text-white/30">
                      {slide.descendantCount} descendiente{slide.descendantCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ── Photo ── */}
            {slide.type === 'photo' && (
              <>
                <img src={slide.photo} alt={slide.caption} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                {(slide.caption || slide.year) && (
                  <div className="absolute bottom-24 left-0 right-0 text-center px-8">
                    <p className="inline-block bg-black/50 backdrop-blur-sm text-white text-lg md:text-xl px-6 py-3 rounded-xl font-light">
                      {slide.caption}
                      {slide.year && <span className="ml-2 text-white/50">({slide.year})</span>}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ── Closing ── */}
            {slide.type === 'closing' && (
              <div className="flex flex-col items-center text-center px-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                  className="text-5xl mb-6"
                >
                  🕊️
                </motion.div>
                <motion.p
                  className="text-2xl md:text-3xl font-serif italic text-white/60 max-w-lg leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  &ldquo;{slide.text}&rdquo;
                </motion.p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {!loading && slides.length === 0 && (
        <div className="text-white/70 text-lg">No hay contenido para mostrar</div>
      )}

      {/* ── Progress bar ── */}
      {!loading && slides.length > 1 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20">
          <motion.div
            className="h-full bg-[#B8963E]"
            initial={{ width: 0 }}
            animate={{ width: `${((current + 1) / slides.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* ── Controls ── */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-4 px-6 transition-opacity duration-500"
        style={{ opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? 'auto' : 'none' }}
      >
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/10">
          <button onClick={goPrev} className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setPlaying(p => !p)} className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition">
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button onClick={goNext} className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition">
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-white/50 text-sm ml-2 tabular-nums">
            {slides.length > 0 ? `${current + 1} / ${slides.length}` : ''}
          </span>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <button onClick={onClose} className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PresentationButton ───────────────────────────────────────

export function PresentationButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#152238] text-white text-sm font-medium hover:bg-[#152238]/90 transition shadow-lg"
    >
      <Maximize className="w-4 h-4" />
      Modo Presentacion
    </button>
  )
}

export default PresentationMode
