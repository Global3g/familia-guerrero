import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, X, ChevronLeft, ChevronRight, Maximize } from 'lucide-react'
import { getFamilyMembers, getGrandparents, getGalleryPhotos } from '../firebase/familyService'

// ── Helpers ────────────────────────────────────────────────────

function calculateAge(birthDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function buildSlides(members, galleryPhotos, grandparents) {
  const slides = []

  // Count total people
  const totalPeople = members.length + (grandparents ? 2 : 0)

  // Title slide
  slides.push({
    type: 'title',
    title: 'Familia Guerrero',
    subtitle: `${totalPeople} miembros de la familia`,
  })

  // Grandparents slides
  if (grandparents) {
    if (grandparents.grandfatherName) {
      slides.push({
        type: 'person',
        name: grandparents.grandfatherName,
        photo: grandparents.grandfatherPhoto || null,
        age: calculateAge(grandparents.grandfatherBirth),
        relationship: 'Abuelo',
        bio: grandparents.grandfatherBio || '',
      })
    }
    if (grandparents.grandmotherName) {
      slides.push({
        type: 'person',
        name: grandparents.grandmotherName,
        photo: grandparents.grandmotherPhoto || null,
        age: calculateAge(grandparents.grandmotherBirth),
        relationship: 'Abuela',
        bio: grandparents.grandmotherBio || '',
      })
    }
  }

  // Person slides (only those with photos)
  members
    .filter((m) => m.photoURL || m.photo)
    .forEach((m) => {
      slides.push({
        type: 'person',
        name: m.name || 'Sin nombre',
        photo: m.photoURL || m.photo,
        age: calculateAge(m.birthDate || m.birth),
        relationship: m.relationship || m.role || '',
        bio: m.bio || m.description || '',
      })
    })

  // Gallery photo slides
  galleryPhotos
    .filter((p) => p.url || p.photoURL)
    .forEach((p) => {
      slides.push({
        type: 'photo',
        photo: p.url || p.photoURL,
        caption: p.caption || p.title || p.description || '',
      })
    })

  return slides
}

// ── PresentationMode (fullscreen overlay) ──────────────────────

function PresentationMode({ isOpen, onClose }) {
  const [slides, setSlides] = useState([])
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [loading, setLoading] = useState(true)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [interval] = useState(6000)

  // Load data
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const [members, grandparents, gallery] = await Promise.all([
        getFamilyMembers(),
        getGrandparents(),
        getGalleryPhotos(),
      ])
      if (cancelled) return
      const built = buildSlides(members, gallery, grandparents)
      setSlides(built)
      setCurrent(0)
      setPlaying(true)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [isOpen])

  // Auto-advance
  useEffect(() => {
    if (!playing || slides.length === 0) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, interval)
    return () => clearInterval(timer)
  }, [playing, slides.length, interval])

  // Auto-hide controls after 3s of no interaction
  useEffect(() => {
    if (!isOpen) return
    let hideTimer = setTimeout(() => setControlsVisible(false), 3000)
    const handleMove = () => {
      setControlsVisible(true)
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => setControlsVisible(false), 3000)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchstart', handleMove)
    return () => {
      clearTimeout(hideTimer)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchstart', handleMove)
    }
  }, [isOpen])

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p) }
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, slides.length])

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % Math.max(slides.length, 1))
  }, [slides.length])

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % Math.max(slides.length, 1))
  }, [slides.length])

  if (!isOpen) return null

  const slide = slides[current]

  return (
    <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center overflow-hidden">
      {/* Loading state */}
      {loading && (
        <div className="text-white text-xl font-light animate-pulse">
          Cargando presentacion...
        </div>
      )}

      {/* Slides */}
      {!loading && slides.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* ── Title Slide ── */}
            {slide.type === 'title' && (
              <div className="flex flex-col items-center justify-center text-center px-8">
                <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-tight">
                  {slide.title}
                </h1>
                <p className="text-xl md:text-2xl text-white/70 font-light">
                  {slide.subtitle}
                </p>
              </div>
            )}

            {/* ── Person Slide ── */}
            {slide.type === 'person' && (
              <>
                {/* Blurred background */}
                {slide.photo && (
                  <img
                    src={slide.photo}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'blur(20px) brightness(0.3)' }}
                  />
                )}
                {/* Centered card */}
                <div className="relative z-10 flex flex-col items-center text-center px-8">
                  {slide.photo ? (
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl mb-6">
                      <img
                        src={slide.photo}
                        alt={slide.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-white/10 border-4 border-white/30 flex items-center justify-center mb-6">
                      <span className="text-6xl text-white/50">
                        {slide.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {slide.name}
                  </h2>
                  <div className="flex items-center gap-3 text-white/70 text-lg mb-4">
                    {slide.relationship && <span>{slide.relationship}</span>}
                    {slide.relationship && slide.age != null && <span>·</span>}
                    {slide.age != null && <span>{slide.age} anos</span>}
                  </div>
                  {slide.bio && (
                    <p className="text-white/60 text-lg max-w-lg leading-relaxed line-clamp-3">
                      {slide.bio}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ── Photo Slide ── */}
            {slide.type === 'photo' && (
              <>
                <img
                  src={slide.photo}
                  alt={slide.caption}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {slide.caption && (
                  <div className="absolute bottom-24 left-0 right-0 text-center px-8">
                    <p className="inline-block bg-black/50 backdrop-blur-sm text-white text-lg md:text-xl px-6 py-3 rounded-xl font-light">
                      {slide.caption}
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* No slides */}
      {!loading && slides.length === 0 && (
        <div className="text-white/70 text-lg">No hay contenido para mostrar</div>
      )}

      {/* ── Controls bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 py-4 px-6 transition-opacity duration-500"
        style={{ opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? 'auto' : 'none' }}
      >
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-3 border-4 border-white/80">
          {/* Prev */}
          <button
            onClick={goPrev}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => setPlaying((p) => !p)}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label={playing ? 'Pausar' : 'Reproducir'}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          {/* Next */}
          <button
            onClick={goNext}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide counter */}
          <span className="text-white/60 text-sm ml-2 tabular-nums">
            {slides.length > 0 ? `${current + 1} / ${slides.length}` : ''}
          </span>

          {/* Divider */}
          <div className="w-px h-6 bg-white/20 mx-1" />

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PresentationButton (trigger) ───────────────────────────────

export function PresentationButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] text-white text-sm font-medium hover:bg-[#0F172A]/90 transition shadow-lg"
    >
      <Maximize className="w-4 h-4" />
      Modo Presentacion
    </button>
  )
}

export default PresentationMode
