import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Heart, RotateCcw } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

// ── Person Card ──────────────────────────────────────────────
function PersonCard({ name, photoURL, isDeceased, isGrandparent }) {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const borderColor = isGrandparent ? '#B8943E' : '#7A9E7E'
  const bgCard = isGrandparent ? '#FFFBF5' : '#FAF6EE'

  return (
    <div
      className="w-28 h-32 rounded-xl flex flex-col items-center justify-center gap-1.5 px-2 cursor-default select-none transition-transform duration-200"
      style={{
        backgroundColor: bgCard,
        border: `2px solid ${borderColor}`,
        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
        opacity: isDeceased ? 0.8 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateZ(18px) scale(1.06)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = ''
      }}
    >
      {photoURL ? (
        <img
          src={photoURL}
          alt={name}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          style={{ border: `2px solid ${borderColor}` }}
        />
      ) : (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{ backgroundColor: `${borderColor}20`, color: borderColor }}
        >
          {initials || <User className="w-5 h-5" />}
        </div>
      )}
      <p
        className="text-[11px] font-semibold leading-tight text-center line-clamp-2"
        style={{ color: '#5D4037' }}
      >
        {name}
      </p>
      {isDeceased && (
        <span className="text-[9px] italic" style={{ color: '#B8943E' }}>
          En memoria
        </span>
      )}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────
export default function Tree3D() {
  const [grandparents, setGrandparents] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  // Rotation state
  const [tiltX, setTiltX] = useState(12)
  const [tiltY, setTiltY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, tiltX: 0, tiltY: 0 })
  const [is3D, setIs3D] = useState(true)

  // ── Load data ────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [mbrs, gp] = await Promise.all([getFamilyMembers(), getGrandparents()])
        setMembers(mbrs || [])
        setGrandparents(gp || null)
      } catch (err) {
        console.error('Tree3D: error loading data', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Drag handlers ────────────────────────────────────────
  const handleMouseDown = (e) => {
    setDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY, tiltX, tiltY })
  }

  const handleMouseMove = (e) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    const newTiltY = Math.max(-15, Math.min(15, dragStart.tiltY + dx * 0.15))
    const newTiltX = Math.max(-15, Math.min(15, dragStart.tiltX - dy * 0.15))
    setTiltY(newTiltY)
    setTiltX(newTiltX)
  }

  const handleMouseUp = () => setDragging(false)

  const handleTouchStart = (e) => {
    const t = e.touches[0]
    setDragging(true)
    setDragStart({ x: t.clientX, y: t.clientY, tiltX, tiltY })
  }

  const handleTouchMove = (e) => {
    if (!dragging) return
    const t = e.touches[0]
    const dx = t.clientX - dragStart.x
    const dy = t.clientY - dragStart.y
    const newTiltY = Math.max(-15, Math.min(15, dragStart.tiltY + dx * 0.15))
    const newTiltX = Math.max(-15, Math.min(15, dragStart.tiltX - dy * 0.15))
    setTiltY(newTiltY)
    setTiltX(newTiltX)
  }

  const handleReset = () => {
    setTiltX(12)
    setTiltY(0)
  }

  // ── Derive grandparent cards ─────────────────────────────
  const gf = grandparents?.grandfather
  const gm = grandparents?.grandmother
  // Fallback for flat-field format from Firebase
  const grandparentCards = []
  if (gf?.name || gf?.fullName || grandparents?.grandfatherName) {
    grandparentCards.push({
      name: gf?.fullName || gf?.name || grandparents?.grandfatherName || 'Abuelo',
      photoURL: gf?.photoURL || grandparents?.grandfatherPhoto || null,
      isDeceased: !!(gf?.deathDate || grandparents?.grandfatherDeath),
    })
  }
  if (gm?.name || gm?.fullName || grandparents?.grandmotherName) {
    grandparentCards.push({
      name: gm?.fullName || gm?.name || grandparents?.grandmotherName || 'Abuela',
      photoURL: gm?.photoURL || grandparents?.grandmotherPhoto || null,
      isDeceased: !!(gm?.deathDate || grandparents?.grandmotherDeath),
    })
  }

  // ── Derive children (gen 1) and grandchildren (gen 2) ────
  const childrenCards = members.map((m) => ({
    id: m.id,
    name: m.fullName || m.name,
    photoURL: m.photoURL || null,
    isDeceased: !!m.deathDate,
  }))

  const grandchildrenCards = members.flatMap(
    (m) =>
      (m.children || []).map((c) => ({
        id: c.id || c.name,
        name: c.fullName || c.name,
        photoURL: c.photoURL || null,
        isDeceased: !!c.deathDate,
      }))
  )

  // ── Active transforms ────────────────────────────────────
  const activeX = is3D ? tiltX : 0
  const activeY = is3D ? tiltY : 0

  // ── Render ───────────────────────────────────────────────
  const hasData = grandparentCards.length > 0 || members.length > 0

  return (
    <section className="py-16 px-4 sm:px-6" style={{ backgroundColor: '#FFFDF7' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-3">
            <h2
              className="text-3xl md:text-4xl font-serif font-bold"
              style={{ color: '#5D4037' }}
            >
              Vista 3D
            </h2>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#B8943E20', color: '#B8943E' }}
            >
              Beta
            </span>
          </div>
          <p className="text-sm max-w-md mx-auto" style={{ color: '#6B5B5B' }}>
            Arrastra para rotar la perspectiva del arbol familiar.
          </p>
        </motion.div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: '#7A9E7E20', color: '#7A9E7E' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Centrar
          </button>
          <button
            onClick={() => setIs3D((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{
              backgroundColor: is3D ? '#B8943E20' : '#5D403715',
              color: is3D ? '#B8943E' : '#5D4037',
            }}
          >
            {is3D ? 'Plano' : '3D'}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div
              className="w-8 h-8 border-3 rounded-full animate-spin"
              style={{ borderColor: '#B8943E30', borderTopColor: '#B8943E' }}
            />
          </div>
        )}

        {/* No data */}
        {!loading && !hasData && (
          <div
            className="text-center py-16 rounded-2xl"
            style={{ backgroundColor: '#FAF6EE' }}
          >
            <User className="w-10 h-10 mx-auto mb-3" style={{ color: '#B8943E80' }} />
            <p className="text-sm font-medium" style={{ color: '#5D4037' }}>
              Aun no hay datos del arbol familiar.
            </p>
            <p className="text-xs mt-1" style={{ color: '#6B5B5B' }}>
              Agrega abuelos y miembros desde el panel de administracion.
            </p>
          </div>
        )}

        {/* 3D Tree */}
        {!loading && hasData && (
          <div
            className="relative overflow-hidden rounded-2xl mx-auto select-none"
            style={{
              maxHeight: 500,
              perspective: is3D ? '1200px' : 'none',
              perspectiveOrigin: '50% 30%',
              backgroundColor: '#FAF6EE',
              cursor: dragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <div
              className="py-10 px-4"
              style={{
                transform: is3D
                  ? `rotateX(${activeX}deg) rotateY(${activeY}deg)`
                  : 'none',
                transformStyle: 'preserve-3d',
                transition: dragging ? 'none' : 'transform 0.3s ease-out',
              }}
            >
              {/* Level 0: Grandparents */}
              {grandparentCards.length > 0 && (
                <div
                  className="flex justify-center items-end gap-4 mb-10"
                  style={{ transform: is3D ? 'translateZ(0px)' : 'none' }}
                >
                  {grandparentCards.length === 2 && (
                    <Heart
                      className="w-5 h-5 absolute"
                      style={{
                        color: '#C4704B',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -70%)',
                        zIndex: 5,
                      }}
                    />
                  )}
                  {grandparentCards.map((gp, i) => (
                    <PersonCard
                      key={`gp-${i}`}
                      name={gp.name}
                      photoURL={gp.photoURL}
                      isDeceased={gp.isDeceased}
                      isGrandparent
                    />
                  ))}
                </div>
              )}

              {/* Connector line */}
              {grandparentCards.length > 0 && childrenCards.length > 0 && (
                <div className="flex justify-center mb-2">
                  <div
                    className="w-px h-6"
                    style={{ backgroundColor: '#B8943E60' }}
                  />
                </div>
              )}

              {/* Level 1: Children */}
              {childrenCards.length > 0 && (
                <div
                  className="flex justify-center gap-4 flex-wrap mb-10"
                  style={{ transform: is3D ? 'translateZ(-80px)' : 'none' }}
                >
                  {childrenCards.map((c) => (
                    <PersonCard
                      key={c.id}
                      name={c.name}
                      photoURL={c.photoURL}
                      isDeceased={c.isDeceased}
                      isGrandparent={false}
                    />
                  ))}
                </div>
              )}

              {/* Connector line */}
              {childrenCards.length > 0 && grandchildrenCards.length > 0 && (
                <div className="flex justify-center mb-2">
                  <div
                    className="w-px h-6"
                    style={{ backgroundColor: '#7A9E7E60' }}
                  />
                </div>
              )}

              {/* Level 2: Grandchildren */}
              {grandchildrenCards.length > 0 && (
                <div
                  className="flex justify-center gap-3 flex-wrap"
                  style={{ transform: is3D ? 'translateZ(-160px)' : 'none' }}
                >
                  {grandchildrenCards.map((gc, i) => (
                    <PersonCard
                      key={gc.id || `gc-${i}`}
                      name={gc.name}
                      photoURL={gc.photoURL}
                      isDeceased={gc.isDeceased}
                      isGrandparent={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hint */}
        {!loading && hasData && (
          <p
            className="text-center text-[11px] mt-3"
            style={{ color: '#6B5B5B90' }}
          >
            {is3D
              ? 'Arrastra para rotar / Pulsa "Plano" para vista sin perspectiva'
              : 'Pulsa "3D" para activar la perspectiva'}
          </p>
        )}
      </div>
    </section>
  )
}
