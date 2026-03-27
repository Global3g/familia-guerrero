import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { User, Heart, RotateCcw, Maximize2, X, ChevronDown, ZoomIn, ZoomOut } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

// ── Tiny Person Card ────────────────────────────────────────
function PersonCard({ name, photoURL, isDeceased, isGrandparent, size = 'md' }) {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const borderColor = isGrandparent ? '#B8943E' : '#7A9E7E'
  const bgCard = isGrandparent ? '#FFFBF5' : '#FAF6EE'
  const isSmall = size === 'sm'

  return (
    <div
      className={`${isSmall ? 'w-24 min-h-[88px]' : 'w-28 min-h-[104px]'} rounded-xl flex flex-col items-center justify-center gap-1 px-1.5 py-2 cursor-default select-none flex-shrink-0`}
      style={{
        backgroundColor: bgCard,
        border: `2px solid ${borderColor}`,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        opacity: isDeceased ? 0.75 : 1,
      }}
    >
      {photoURL ? (
        <img
          src={photoURL}
          alt={name}
          className={`${isSmall ? 'w-9 h-9' : 'w-11 h-11'} rounded-full object-cover flex-shrink-0`}
          style={{ border: `2px solid ${borderColor}` }}
        />
      ) : (
        <div
          className={`${isSmall ? 'w-9 h-9' : 'w-11 h-11'} rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold`}
          style={{ backgroundColor: `${borderColor}20`, color: borderColor }}
        >
          {initials || <User className="w-4 h-4" />}
        </div>
      )}
      <p
        className={`${isSmall ? 'text-[9px]' : 'text-[10px]'} font-semibold leading-tight text-center line-clamp-2`}
        style={{ color: '#5D4037' }}
      >
        {name}
      </p>
      {isDeceased && (
        <span className="text-[8px] italic" style={{ color: '#B8943E' }}>
          En memoria
        </span>
      )}
    </div>
  )
}

// ── Level Label ─────────────────────────────────────────────
function LevelLabel({ label, color, count }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-3">
      <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: `${color}40` }} />
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>
        {label}
      </span>
      <span
        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {count}
      </span>
      <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: `${color}40` }} />
    </div>
  )
}

// ── Arrow connector (SVG) ───────────────────────────────────
function ArrowDown({ color = '#B8943E60' }) {
  return (
    <div className="flex justify-center my-1">
      <svg width="20" height="28" viewBox="0 0 20 28">
        <line x1="10" y1="0" x2="10" y2="22" stroke={color} strokeWidth="2" />
        <polygon points="4,18 10,26 16,18" fill={color} />
      </svg>
    </div>
  )
}

// ── Family Group (parent + their children) ──────────────────
function FamilyGroup({ parentName, parentColor, children, cardSize }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-[9px] font-bold uppercase tracking-wider mb-1.5 px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `${parentColor}15`, color: parentColor }}
      >
        Hijos de {parentName}
      </span>
      <div className="flex flex-wrap justify-center gap-2">
        {children.map((c, i) => (
          <PersonCard
            key={c.id || `c-${i}`}
            name={c.name}
            photoURL={c.photoURL}
            isDeceased={c.isDeceased}
            isGrandparent={false}
            size={cardSize}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────
export default function Tree3D() {
  const [grandparents, setGrandparents] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [tiltX, setTiltX] = useState(8)
  const [tiltY, setTiltY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, tiltX: 0, tiltY: 0 })
  const [is3D, setIs3D] = useState(true)
  const [zoom, setZoom] = useState(1)
  const contentRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const [mbrs, gp] = await Promise.all([getFamilyMembers(), getGrandparents()])
        const sortByBirth = (arr) => {
          if (!arr) return arr
          arr.sort((a, b) => {
            if (!a.birthDate && !b.birthDate) return 0
            if (!a.birthDate) return 1
            if (!b.birthDate) return -1
            return a.birthDate.localeCompare(b.birthDate)
          })
          arr.forEach(p => { if (p.children) sortByBirth(p.children) })
          return arr
        }
        sortByBirth(mbrs)
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

  // ESC to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return
    const handler = (e) => { if (e.key === 'Escape') setIsFullscreen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFullscreen])

  // Drag handlers
  const handleMouseDown = (e) => {
    setDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY, tiltX, tiltY })
  }
  const handleMouseMove = (e) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    setTiltY(Math.max(-20, Math.min(20, dragStart.tiltY + dx * 0.12)))
    setTiltX(Math.max(-20, Math.min(20, dragStart.tiltX - dy * 0.12)))
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
    setTiltY(Math.max(-20, Math.min(20, dragStart.tiltY + dx * 0.12)))
    setTiltX(Math.max(-20, Math.min(20, dragStart.tiltX - dy * 0.12)))
  }

  // Zoom with mouse wheel or pinch
  const handleWheel = (e) => {
    e.preventDefault()
    setZoom(z => Math.max(0.3, Math.min(2.5, z + (e.deltaY > 0 ? -0.08 : 0.08))))
  }

  // ── Build data ────────────────────────────────────────────
  const gf = grandparents?.grandfather
  const gm = grandparents?.grandmother
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

  const childrenCards = members.map((m) => ({
    id: m.id,
    name: m.fullName || m.name,
    shortName: (m.name || m.fullName || '').split(' ')[0],
    photoURL: m.photoURL || null,
    isDeceased: !!m.deathDate,
  }))

  // Nietos agrupados por padre
  const grandchildrenByParent = members
    .filter(m => (m.children || []).length > 0)
    .map(m => ({
      parentName: (m.name || '').split(' ')[0],
      parentColor: m.gender === 'F' ? '#C4704B' : '#7A9E7E',
      children: (m.children || []).map(c => ({
        id: c.id || c.name,
        name: c.fullName || c.name,
        shortName: (c.name || c.fullName || '').split(' ')[0],
        photoURL: c.photoURL || null,
        isDeceased: !!c.deathDate,
      })),
    }))

  // Bisnietos agrupados por nieto
  const greatGrandchildrenByParent = members.flatMap(m =>
    (m.children || [])
      .filter(c => (c.children || []).length > 0)
      .map(c => ({
        parentName: (c.name || '').split(' ')[0],
        parentColor: c.gender === 'F' ? '#C4704B' : '#7A9E7E',
        children: (c.children || []).map(gc => ({
          id: gc.id || gc.name,
          name: gc.fullName || gc.name,
          photoURL: gc.photoURL || null,
          isDeceased: !!gc.deathDate,
        })),
      }))
  )

  // Tataranietos agrupados
  const greatGreatGrandchildrenByParent = members.flatMap(m =>
    (m.children || []).flatMap(c =>
      (c.children || [])
        .filter(gc => (gc.children || []).length > 0)
        .map(gc => ({
          parentName: (gc.name || '').split(' ')[0],
          parentColor: gc.gender === 'F' ? '#C4704B' : '#7A9E7E',
          children: (gc.children || []).map(ggc => ({
            id: ggc.id || ggc.name,
            name: ggc.fullName || ggc.name,
            photoURL: ggc.photoURL || null,
            isDeceased: !!ggc.deathDate,
          })),
        }))
    )
  )

  const totalGrandchildren = grandchildrenByParent.reduce((s, g) => s + g.children.length, 0)
  const totalGreatGrandchildren = greatGrandchildrenByParent.reduce((s, g) => s + g.children.length, 0)
  const totalGreatGreat = greatGreatGrandchildrenByParent.reduce((s, g) => s + g.children.length, 0)

  const hasData = grandparentCards.length > 0 || members.length > 0
  const activeX = is3D ? tiltX : 0
  const activeY = is3D ? tiltY : 0

  // Determine card size based on total people
  const totalPeople = childrenCards.length + totalGrandchildren + totalGreatGrandchildren + totalGreatGreat
  const cardSize = totalPeople > 40 ? 'sm' : 'md'

  // ── Tree content builder ────────────────────────────────────
  const renderTree = (fullscreen) => {
    const use3D = is3D

    return (
    <div
      ref={contentRef}
      className={fullscreen ? 'h-full overflow-auto' : ''}
      style={{
        perspective: use3D ? '1200px' : 'none',
        perspectiveOrigin: '50% 20%',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        className="py-8 px-4"
        style={{
          transform: `scale(${zoom})${use3D ? ` rotateX(${activeX}deg) rotateY(${activeY}deg)` : ''}`,
          transformOrigin: 'center top',
          transformStyle: use3D ? 'preserve-3d' : 'flat',
          transition: dragging ? 'none' : 'transform 0.3s ease-out',
          minWidth: fullscreen ? 'max-content' : undefined,
        }}
      >
        {/* Level 0: Abuelos */}
        {grandparentCards.length > 0 && (
          <>
            <LevelLabel label="Abuelos" color="#B8943E" count={grandparentCards.length} />
            <div
              className="flex justify-center items-end gap-4 mb-2"
              style={{ transform: use3D ? 'translateZ(0px)' : 'none' }}
            >
              {grandparentCards.length === 2 && (
                <Heart className="w-5 h-5 absolute" style={{ color: '#C4704B', zIndex: 5 }} />
              )}
              {grandparentCards.map((gp, i) => (
                <PersonCard key={`gp-${i}`} name={gp.name} photoURL={gp.photoURL} isDeceased={gp.isDeceased} isGrandparent size={cardSize} />
              ))}
            </div>
          </>
        )}

        {/* Arrow to hijos */}
        {grandparentCards.length > 0 && childrenCards.length > 0 && (
          <ArrowDown color="#B8943E80" />
        )}

        {/* Level 1: Hijos */}
        {childrenCards.length > 0 && (
          <div style={{ transform: use3D ? 'translateZ(-60px)' : 'none' }}>
            <LevelLabel label="Hijos" color="#C4704B" count={childrenCards.length} />
            <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
              <div className="flex justify-center gap-2 min-w-max px-4">
                {childrenCards.map((c) => (
                  <PersonCard key={c.id} name={c.name} photoURL={c.photoURL} isDeceased={c.isDeceased} isGrandparent={false} size={cardSize} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Arrow to nietos */}
        {childrenCards.length > 0 && totalGrandchildren > 0 && (
          <ArrowDown color="#7A9E7E80" />
        )}

        {/* Level 2: Nietos (agrupados por padre) */}
        {totalGrandchildren > 0 && (
          <div style={{ transform: use3D ? 'translateZ(-120px)' : 'none' }}>
            <LevelLabel label="Nietos" color="#7A9E7E" count={totalGrandchildren} />
            <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
              <div className="flex justify-center gap-6 min-w-max px-4">
                {grandchildrenByParent.map((group, gi) => (
                  <FamilyGroup
                    key={`gc-group-${gi}`}
                    parentName={group.parentName}
                    parentColor={group.parentColor}
                    children={group.children}
                    cardSize={cardSize}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Arrow to bisnietos */}
        {totalGrandchildren > 0 && totalGreatGrandchildren > 0 && (
          <ArrowDown color="#5D403760" />
        )}

        {/* Level 3: Bisnietos (agrupados por nieto) */}
        {totalGreatGrandchildren > 0 && (
          <div style={{ transform: use3D ? 'translateZ(-180px)' : 'none' }}>
            <LevelLabel label="Bisnietos" color="#5D4037" count={totalGreatGrandchildren} />
            <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
              <div className="flex justify-center gap-6 min-w-max px-4">
                {greatGrandchildrenByParent.map((group, gi) => (
                  <FamilyGroup
                    key={`ggc-group-${gi}`}
                    parentName={group.parentName}
                    parentColor={group.parentColor}
                    children={group.children}
                    cardSize={cardSize}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Arrow to tataranietos */}
        {totalGreatGrandchildren > 0 && totalGreatGreat > 0 && (
          <ArrowDown color="#6B5B5B50" />
        )}

        {/* Level 4: Tataranietos */}
        {totalGreatGreat > 0 && (
          <div style={{ transform: use3D ? 'translateZ(-240px)' : 'none' }}>
            <LevelLabel label="Tataranietos" color="#6B5B5B" count={totalGreatGreat} />
            <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
              <div className="flex justify-center gap-6 min-w-max px-4">
                {greatGreatGrandchildrenByParent.map((group, gi) => (
                  <FamilyGroup
                    key={`gggc-group-${gi}`}
                    parentName={group.parentName}
                    parentColor={group.parentColor}
                    children={group.children}
                    cardSize={cardSize}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    )
  }

  // ── Controls bar ──────────────────────────────────────────
  const controlsBar = (
    <div className="flex items-center justify-center gap-2 py-3 px-4" style={{ backgroundColor: '#FAF6EE' }}>
      <button
        onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
        style={{ backgroundColor: '#5D403715', color: '#5D4037' }}
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <span className="text-[10px] font-medium min-w-[36px] text-center" style={{ color: '#5D4037' }}>{Math.round(zoom * 100)}%</span>
      <button
        onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
        style={{ backgroundColor: '#5D403715', color: '#5D4037' }}
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => { setTiltX(8); setTiltY(0); setZoom(1) }}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        style={{ backgroundColor: '#7A9E7E20', color: '#7A9E7E' }}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Centrar
      </button>
      <button
        onClick={() => setIs3D((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        style={{ backgroundColor: is3D ? '#B8943E20' : '#5D403715', color: is3D ? '#B8943E' : '#5D4037' }}
      >
        {is3D ? 'Plano' : '3D'}
      </button>
      <button
        onClick={() => setIsFullscreen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        style={{ backgroundColor: isFullscreen ? '#C4704B20' : '#C4704B15', color: '#C4704B' }}
      >
        {isFullscreen ? <X className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        {isFullscreen ? 'Cerrar' : 'Pantalla completa'}
      </button>
    </div>
  )

  return (
    <>
      {/* Inline section */}
      <section className="py-16 px-4 sm:px-6" style={{ backgroundColor: '#FFFDF7' }}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 mb-3">
              <h2 className="text-3xl md:text-4xl font-serif font-bold" style={{ color: '#5D4037' }}>
                Vista Familiar
              </h2>
            </div>
            <p className="text-sm max-w-md mx-auto" style={{ color: '#6B5B5B' }}>
              Todas las generaciones organizadas por familia. Arrastra para rotar en 3D.
            </p>
          </motion.div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: '#B8943E30', borderTopColor: '#B8943E' }} />
            </div>
          )}

          {/* No data */}
          {!loading && !hasData && (
            <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: '#FAF6EE' }}>
              <User className="w-10 h-10 mx-auto mb-3" style={{ color: '#B8943E80' }} />
              <p className="text-sm font-medium" style={{ color: '#5D4037' }}>Aun no hay datos del arbol familiar.</p>
            </div>
          )}

          {/* Inline tree (compact) */}
          {!loading && hasData && !isFullscreen && (
            <div className="rounded-2xl overflow-hidden select-none" style={{ backgroundColor: '#FAF6EE', maxHeight: 600 }}>
              {controlsBar}
              <div className="overflow-hidden" style={{ maxHeight: 520 }}>
                {renderTree(false)}
              </div>
              <p className="text-center text-[11px] py-2" style={{ color: '#6B5B5B80' }}>
                Usa "Pantalla completa" para ver todas las generaciones con scroll
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Fullscreen overlay */}
      {isFullscreen && hasData && (
        <div className="fixed inset-0 z-[70] flex flex-col" style={{ backgroundColor: '#FAF6EE' }}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: '#E0D5C8', backgroundColor: '#FFFBF5' }}>
            <h3 className="text-sm font-serif font-bold" style={{ color: '#5D4037' }}>
              Arbol Familiar Completo
            </h3>
            <div className="flex items-center gap-2">
              {controlsBar}
            </div>
          </div>
          {/* Scrollable tree — both directions */}
          <div className="flex-1 overflow-auto select-none">
            {renderTree(true)}
          </div>
        </div>
      )}
    </>
  )
}
