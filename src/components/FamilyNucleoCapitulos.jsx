import { Heart, User, Calendar, Home, MapPin, Users } from 'lucide-react'
import DeceasedCross from '../utils/DeceasedCross'

const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function formatDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const day = parseInt(parts[2])
  const month = parseInt(parts[1])
  const year = parts[0]
  return `${day} de ${monthNames[month - 1]} de ${year}`
}

function calcAge(birthDate, deathDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const end = deathDate ? new Date(deathDate) : new Date()
  let age = end.getFullYear() - birth.getFullYear()
  const m = end.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--
  return age
}

function weddingYears(dateStr) {
  if (!dateStr) return 0
  const wd = new Date(dateStr)
  const now = new Date()
  let y = now.getFullYear() - wd.getFullYear()
  if (now.getMonth() < wd.getMonth() || (now.getMonth() === wd.getMonth() && now.getDate() < wd.getDate())) y--
  return y > 0 ? y : 0
}

function GoldDivider() {
  return (
    <div className="flex items-center gap-3 justify-center my-4">
      <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, transparent, #B8963E, transparent)' }} />
      <span className="text-sm" style={{ color: '#B8963E' }}>&#10086;</span>
      <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, transparent, #B8963E, transparent)' }} />
    </div>
  )
}

function PersonPhoto({ person, size = 'lg', onClickPhoto }) {
  const sizes = { sm: 'w-20 h-20', md: 'w-36 h-36', lg: 'w-52 h-52', xl: 'w-[280px] h-[280px]' }
  const iconSizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16', xl: 'w-20 h-20' }
  const glowSizes = { sm: false, md: false, lg: true, xl: true }
  const s = sizes[size]
  const i = iconSizes[size]
  const glow = glowSizes[size]

  if (person?.photoURL) {
    return (
      <div className="relative group">
        {glow && <div className="absolute -inset-2 rounded-full blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-500" style={{ background: 'radial-gradient(circle, rgba(184,150,62,0.35), transparent 70%)' }} />}
        <img
          src={person.photoURL}
          alt={person.name}
          className={`${s} rounded-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300 relative`}
          style={{ border: '3px solid rgba(184,150,62,0.5)', boxShadow: glow ? '0 12px 40px rgba(0,0,0,0.25), 0 0 20px rgba(184,150,62,0.15)' : '0 8px 30px rgba(0,0,0,0.2)' }}
          onClick={() => onClickPhoto?.({ photoURL: person.photoURL, caption: person.name })}
        />
      </div>
    )
  }
  return (
    <div className={`${s} rounded-full flex items-center justify-center`} style={{ background: 'rgba(184,150,62,0.08)', border: '3px solid rgba(184,150,62,0.2)' }}>
      <User className={i} style={{ color: '#B8963E', opacity: 0.4 }} />
    </div>
  )
}

function AgeBadge({ birthDate, deathDate }) {
  const age = calcAge(birthDate, deathDate)
  if (age === null) return null
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(184,150,62,0.12)', color: '#6B6B6B' }}>
      {age} años
    </span>
  )
}

// ponytail: single component, all rendering inline. Extract sub-components if it grows past 800 lines.
export default function FamilyNucleoCapitulos({ selectedMember, onClickPhoto }) {
  if (!selectedMember) return null

  const sp = selectedMember.spouse
  const spouseName = sp ? (typeof sp === 'object' ? sp.name : sp) : null
  const children = (selectedMember.children || []).filter(Boolean)
  const totalGrandchildren = children.reduce((acc, c) => acc + (c.children ? c.children.filter(Boolean).length : 0), 0)

  // Build family title
  const getLastName = (name) => {
    if (!name) return 'Familia'
    const p = name.trim().split(' ')
    return p.length >= 3 ? p[p.length - 2] : p[p.length - 1] || p[0]
  }
  const memberLast = selectedMember.lastName || getLastName(selectedMember.name || selectedMember.fullName)
  const spouseLast = sp && typeof sp === 'object' && sp.lastName ? sp.lastName : (spouseName ? getLastName(spouseName) : null)

  let familyTitle
  if (!spouseLast) familyTitle = `Familia ${memberLast}`
  else if (selectedMember.gender === 'M') familyTitle = `Familia ${memberLast} ${spouseLast}`
  else if (selectedMember.gender === 'F') familyTitle = `Familia ${spouseLast} ${memberLast}`
  else familyTitle = `Familia ${memberLast} ${spouseLast}`

  const wy = weddingYears(selectedMember.weddingDate)

  // Accent colors that cycle per chapter
  const chapterAccents = ['#152238', '#7A2841', '#5B7E6B', '#B8963E', '#152238', '#7A2841', '#5B7E6B', '#B8963E']

  return (
    <div className="-mx-6 sm:-mx-10">
      {/* ===== HERO CHAPTER: Parents — ivory background ===== */}
      <section className="py-16 px-6 sm:px-10" style={{ background: '#FFFDF7' }}>
        <div className="max-w-4xl mx-auto text-center">
          {/* Chapter header */}
          <div className="relative mb-10">
            <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 font-serif text-[100px] font-black italic leading-none select-none" style={{ color: 'rgba(21,34,56,0.04)' }}>00</div>
            <p className="text-xs tracking-[6px] uppercase relative" style={{ color: '#B8963E' }}>Núcleo Familiar</p>
            <h2 className="text-4xl sm:text-5xl font-serif italic font-normal relative mt-2" style={{ color: '#1C1C1C' }}>{familyTitle}</h2>
            <GoldDivider />
          </div>

          {/* Parents photos + info */}
          <div className="flex flex-col sm:flex-row items-start justify-center gap-36 mb-10">
            <div className="text-center w-[280px]">
              <div className="flex justify-center"><PersonPhoto person={selectedMember} size="xl" onClickPhoto={onClickPhoto} /></div>
              <h3 className="text-2xl font-serif italic mt-4" style={{ color: '#1C1C1C' }}>
                {selectedMember.name || selectedMember.fullName}<DeceasedCross deathDate={selectedMember.deathDate} />
              </h3>
              {selectedMember.nickname && <p className="text-lg italic" style={{ color: '#8A8A8A' }}>"{selectedMember.nickname}"</p>}
              <AgeBadge birthDate={selectedMember.birthDate} deathDate={selectedMember.deathDate} />
            </div>

            {sp && (
              <div className="text-center w-[280px]">
                <div className="flex justify-center"><PersonPhoto person={typeof sp === 'object' ? sp : { name: spouseName }} size="xl" onClickPhoto={onClickPhoto} /></div>
                <h3 className="text-2xl font-serif italic mt-4" style={{ color: '#1C1C1C' }}>
                  {spouseName}{typeof sp === 'object' && <DeceasedCross deathDate={sp.deathDate} />}
                </h3>
                {typeof sp === 'object' && sp.nickname && <p className="text-lg italic" style={{ color: '#8A8A8A' }}>"{sp.nickname}"</p>}
                {typeof sp === 'object' && <AgeBadge birthDate={sp.birthDate} deathDate={sp.deathDate} />}
              </div>
            )}
          </div>

          {/* Wedding / location details */}
          {(selectedMember.weddingDate || selectedMember.location) && (
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-lg" style={{ color: '#4A4A4A' }}>
              {selectedMember.weddingDate && (
                <span className="flex items-center gap-2"><Calendar className="w-5 h-5" style={{ color: '#B8963E' }} /> {formatDate(selectedMember.weddingDate)}</span>
              )}
              {selectedMember.weddingPlace && (
                <span className="flex items-center gap-2"><Home className="w-5 h-5" style={{ color: '#5B7E6B' }} /> {selectedMember.weddingPlace}</span>
              )}
              {selectedMember.location && (
                <span className="flex items-center gap-2"><MapPin className="w-5 h-5" style={{ color: '#5B7E6B' }} /> {selectedMember.location}</span>
              )}
              {wy > 0 && (
                <span className="flex items-center gap-2 font-bold" style={{ color: '#B8963E' }}><Heart className="w-5 h-5" /> {wy} años casados</span>
              )}
            </div>
          )}

          {selectedMember.bio && (
            <p className="mt-6 text-base italic leading-relaxed max-w-2xl mx-auto" style={{ color: '#8A8A8A' }}>{selectedMember.bio}</p>
          )}
        </div>
      </section>

      {/* ===== STATS BAND — navy ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ background: '#152238' }}>
        {[
          { num: children.length, label: 'Hijos' },
          { num: totalGrandchildren, label: 'Nietos' },
          { num: wy || '—', label: 'Años Casados' },
          { num: selectedMember.location || '—', label: 'Ubicación', isText: true },
        ].map((s, i) => (
          <div key={i} className="text-center py-8 px-4" style={{ borderRight: i < 3 ? '1px solid rgba(184,150,62,0.15)' : 'none' }}>
            <div className="font-serif text-4xl font-black italic" style={{ color: '#D4B76A', textShadow: '0 0 10px rgba(184,150,62,0.4)' }}>
              {s.isText ? <span className="text-lg font-normal not-italic">{s.num}</span> : s.num}
            </div>
            <div className="text-[10px] tracking-[3px] uppercase mt-1 font-bold" style={{ color: '#FFFFFF' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ===== EACH CHILD = ONE CHAPTER ===== */}
      {children.map((child, i) => {
        const isEven = i % 2 === 0
        // ponytail: alternating ivory/parchment backgrounds per chapter
        const bgColor = isEven ? '#FFFDF7' : '#F5F0E8'
        const accent = chapterAccents[i % chapterAccents.length]
        const childSpouse = child.spouse
        const childSpouseName = childSpouse ? (typeof childSpouse === 'object' ? childSpouse.name : childSpouse) : null
        const childChildren = (child.children || []).filter(Boolean)
        const cwy = weddingYears(child.weddingDate)
        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

        return (
          <section key={i} className="py-16 px-6 sm:px-10" style={{ background: bgColor }}>
            <div className="max-w-7xl mx-auto">
              {/* Chapter header */}
              <div className="text-center mb-12 relative">
                <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 font-serif text-[100px] font-black italic leading-none select-none" style={{ color: `${accent}08` }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <p className="text-xs tracking-[6px] uppercase relative" style={{ color: '#B8963E' }}>
                  Rama {romanNumerals[i] || i + 1}
                </p>
                <h2 className="text-3xl sm:text-4xl font-serif italic font-normal relative mt-2" style={{ color: '#1C1C1C' }}>
                  {child.name}<DeceasedCross deathDate={child.deathDate} />
                </h2>
                <GoldDivider />
                {child.role && <p className="text-sm italic relative" style={{ color: '#8A8A8A' }}>{child.role}</p>}
              </div>

              {/* Couple or single person */}
              {childSpouseName ? (
                /* Married: side-by-side photos with info below */
                <div className="mb-10">
                  <div className="flex flex-col sm:flex-row items-start justify-center gap-44 mb-8">
                    <div className="text-center w-[220px]">
                      <div className="flex justify-center"><PersonPhoto person={child} size="lg" onClickPhoto={onClickPhoto} /></div>
                      <h3 className="text-xl font-serif italic mt-3" style={{ color: '#1C1C1C' }}>
                        {child.name}<DeceasedCross deathDate={child.deathDate} />
                      </h3>
                      {child.nickname && <p className="text-lg italic" style={{ color: '#8A8A8A' }}>"{child.nickname}"</p>}
                      <AgeBadge birthDate={child.birthDate} deathDate={child.deathDate} />
                    </div>

                    <div className="text-center w-[220px]">
                      <div className="flex justify-center"><PersonPhoto person={typeof childSpouse === 'object' ? childSpouse : { name: childSpouseName }} size="lg" onClickPhoto={onClickPhoto} /></div>
                      <h3 className="text-xl font-serif italic mt-3" style={{ color: '#1C1C1C' }}>
                        {childSpouseName}{typeof childSpouse === 'object' && <DeceasedCross deathDate={childSpouse.deathDate} />}
                      </h3>
                      {typeof childSpouse === 'object' && childSpouse.nickname && <p className="text-lg italic" style={{ color: '#8A8A8A' }}>"{childSpouse.nickname}"</p>}
                      {typeof childSpouse === 'object' && <AgeBadge birthDate={childSpouse.birthDate} deathDate={childSpouse.deathDate} />}
                    </div>
                  </div>

                  {/* Wedding + location pills */}
                  {(child.weddingDate || child.location) && (
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-lg mb-6" style={{ color: '#4A4A4A' }}>
                      {child.weddingDate && (
                        <span className="flex items-center gap-2"><Calendar className="w-5 h-5" style={{ color: '#B8963E' }} /> {formatDate(child.weddingDate)}</span>
                      )}
                      {child.weddingPlace && (
                        <span className="flex items-center gap-2"><Home className="w-5 h-5" style={{ color: '#5B7E6B' }} /> {child.weddingPlace}</span>
                      )}
                      {child.location && (
                        <span className="flex items-center gap-2"><MapPin className="w-5 h-5" style={{ color: '#5B7E6B' }} /> {child.location}</span>
                      )}
                      {cwy > 0 && (
                        <span className="flex items-center gap-2 font-bold" style={{ color: '#B8963E' }}><Heart className="w-5 h-5" /> {cwy} años casados</span>
                      )}
                    </div>
                  )}

                  {/* Bios */}
                  {(child.bio || (typeof childSpouse === 'object' && childSpouse.bio)) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-44 mt-6 max-w-4xl mx-auto">
                      {child.bio && (
                        <div className="p-6" style={{ background: bgColor === '#FFFDF7' ? '#F5F0E8' : '#FFFDF7', border: '1px solid rgba(184,150,62,0.15)' }}>
                          <div className="w-8 h-0.5 mb-4" style={{ background: accent }} />
                          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8A8A8A' }}>{child.name?.split(' ')[0]}</p>
                          <p className="text-sm leading-relaxed" style={{ color: '#4A4A4A' }}>{child.bio}</p>
                        </div>
                      )}
                      {typeof childSpouse === 'object' && childSpouse.bio && (
                        <div className="p-6" style={{ background: bgColor === '#FFFDF7' ? '#F5F0E8' : '#FFFDF7', border: '1px solid rgba(184,150,62,0.15)' }}>
                          <div className="w-8 h-0.5 mb-4" style={{ background: accent }} />
                          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8A8A8A' }}>{childSpouse.name?.split(' ')[0]}</p>
                          <p className="text-sm leading-relaxed" style={{ color: '#4A4A4A' }}>{childSpouse.bio}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hobbies */}
                  {((child.hobbies?.length > 0) || (typeof childSpouse === 'object' && childSpouse?.hobbies?.length > 0)) && (
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                      {(child.hobbies || []).map((h, hi) => (
                        <span key={`c${hi}`} className="px-3 py-1.5 rounded-full text-sm" style={{ background: 'rgba(184,150,62,0.08)', border: '1px solid rgba(184,150,62,0.2)', color: '#4A4A4A' }}>{h}</span>
                      ))}
                      {typeof childSpouse === 'object' && (childSpouse.hobbies || []).map((h, hi) => (
                        <span key={`s${hi}`} className="px-3 py-1.5 rounded-full text-sm" style={{ background: 'rgba(91,126,107,0.08)', border: '1px solid rgba(91,126,107,0.2)', color: '#4A4A4A' }}>{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Single person — centered like married layout */
                <div className="flex flex-col items-center mb-10">
                  <div className="text-center w-[220px]">
                    <div className="flex justify-center"><PersonPhoto person={child} size="lg" onClickPhoto={onClickPhoto} /></div>
                    <h3 className="text-xl font-serif italic mt-3" style={{ color: '#1C1C1C' }}>
                      {child.name}<DeceasedCross deathDate={child.deathDate} />
                    </h3>
                    {child.nickname && <p className="text-lg italic" style={{ color: '#8A8A8A' }}>"{child.nickname}"</p>}
                    <AgeBadge birthDate={child.birthDate} deathDate={child.deathDate} />
                    {child.location && <p className="text-base mt-2 flex items-center justify-center gap-1.5" style={{ color: '#8A8A8A' }}><MapPin className="w-4 h-4" /> {child.location}</p>}
                  </div>
                  {child.bio && <p className="text-base italic leading-relaxed mt-6 max-w-2xl text-center" style={{ color: '#4A4A4A' }}>{child.bio}</p>}
                </div>
              )}

              {/* ===== GRANDCHILDREN (nietos) of this child ===== */}
              {childChildren.length > 0 && (
                <div className="mt-8">
                  <div className="text-center mb-8">
                    <p className="text-xl tracking-[5px] uppercase font-serif italic font-bold flex items-center justify-center gap-3" style={{ color: '#B8963E' }}>
                      <Users className="w-6 h-6" />
                      Hijos de {child.name?.split(' ')[0]} ({childChildren.length})
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-44 gap-y-8">
                    {childChildren.map((gc, gi) => {
                      const gcSpouse = gc.spouse
                      const gcSpouseName = gcSpouse ? (typeof gcSpouse === 'object' ? gcSpouse.name : gcSpouse) : null
                      const gcChildren = (gc.children || []).filter(Boolean)
                      const gcwy = weddingYears(gc.weddingDate)

                      return (
                        <div key={gi} className="p-6 rounded-sm" style={{
                          background: bgColor === '#FFFDF7' ? '#F5F0E8' : '#FFFDF7',
                          border: '1px solid rgba(184,150,62,0.15)'
                        }}>
                          {/* Grandchild header */}
                          <div className="flex items-center gap-4 mb-4">
                            <PersonPhoto person={gc} size="md" onClickPhoto={onClickPhoto} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm uppercase tracking-wider" style={{ color: '#8A8A8A' }}>
                                {gc.gender === 'F' ? 'Nieta' : gc.gender === 'M' ? 'Nieto' : 'Nieto(a)'}
                              </p>
                              <h4 className="text-2xl font-serif italic truncate" style={{ color: '#1C1C1C' }}>
                                {gc.name}<DeceasedCross deathDate={gc.deathDate} />
                              </h4>
                              {gc.nickname && <p className="text-lg italic" style={{ color: '#8A8A8A' }}>"{gc.nickname}"</p>}
                              <AgeBadge birthDate={gc.birthDate} deathDate={gc.deathDate} />
                            </div>
                          </div>

                          {/* Spouse */}
                          {gcSpouseName && (
                            <div className="flex items-center gap-3 mb-4 pl-4" style={{ borderLeft: `2px solid ${accent}30` }}>
                              <PersonPhoto person={typeof gcSpouse === 'object' ? gcSpouse : { name: gcSpouseName }} size="sm" onClickPhoto={onClickPhoto} />
                              <div className="min-w-0">
                                <p className="text-lg font-serif italic truncate" style={{ color: '#1C1C1C' }}>
                                  {gcSpouseName}{typeof gcSpouse === 'object' && <DeceasedCross deathDate={gcSpouse.deathDate} />}
                                </p>
                                {typeof gcSpouse === 'object' && <AgeBadge birthDate={gcSpouse.birthDate} deathDate={gcSpouse.deathDate} />}
                              </div>
                            </div>
                          )}

                          {/* Wedding */}
                          {(gc.weddingDate || gc.weddingPlace) && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base mb-3" style={{ color: '#8A8A8A' }}>
                              {gc.weddingDate && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" style={{ color: '#B8963E' }} /> {formatDate(gc.weddingDate)}</span>}
                              {gc.weddingPlace && <span className="flex items-center gap-1.5"><Home className="w-4 h-4" style={{ color: '#5B7E6B' }} /> {gc.weddingPlace}</span>}
                              {gcwy > 0 && <span className="flex items-center gap-1.5 font-bold" style={{ color: '#B8963E' }}><Heart className="w-4 h-4" /> {gcwy} años</span>}
                            </div>
                          )}

                          {gc.location && (
                            <p className="text-base flex items-center gap-1.5 mb-3" style={{ color: '#8A8A8A' }}><MapPin className="w-4 h-4" /> {gc.location}</p>
                          )}

                          {/* Bio */}
                          {gc.bio && <p className="text-base italic leading-relaxed mb-3" style={{ color: '#4A4A4A' }}>{gc.bio}</p>}
                          {typeof gcSpouse === 'object' && gcSpouse !== null && gcSpouse.bio && (
                            <p className="text-base italic leading-relaxed mb-3" style={{ color: '#4A4A4A' }}>
                              <span className="text-sm font-semibold uppercase tracking-wider not-italic" style={{ color: '#8A8A8A' }}>{gcSpouse.name?.split(' ')[0]}: </span>
                              {gcSpouse.bio}
                            </p>
                          )}

                          {/* Hobbies */}
                          {((gc.hobbies?.length > 0) || (typeof gcSpouse === 'object' && gcSpouse?.hobbies?.length > 0)) && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {(gc.hobbies || []).map((h, hi) => (
                                <span key={hi} className="px-3 py-1.5 rounded-full text-sm" style={{ background: 'rgba(184,150,62,0.08)', color: '#4A4A4A' }}>{h}</span>
                              ))}
                              {typeof gcSpouse === 'object' && (gcSpouse.hobbies || []).map((h, hi) => (
                                <span key={`s${hi}`} className="px-3 py-1.5 rounded-full text-sm" style={{ background: 'rgba(91,126,107,0.08)', color: '#4A4A4A' }}>{h}</span>
                              ))}
                            </div>
                          )}

                          {/* Great-grandchildren (bisnietos) */}
                          {gcChildren.length > 0 && (
                            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(184,150,62,0.15)' }}>
                              <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#B8963E' }}>
                                <Users className="w-3.5 h-3.5" />
                                Hijos de {gc.name?.split(' ')[0]} ({gcChildren.length})
                              </p>
                              <div className="space-y-3">
                                {gcChildren.map((bn, bi) => (
                                  <div key={bi} className="flex items-center gap-3">
                                    <PersonPhoto person={bn} size="sm" onClickPhoto={onClickPhoto} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-serif italic truncate" style={{ color: '#1C1C1C' }}>
                                        {bn.name}<DeceasedCross deathDate={bn.deathDate} />
                                      </p>
                                      {bn.nickname && <p className="text-base italic" style={{ color: '#8A8A8A' }}>"{bn.nickname}"</p>}
                                      <AgeBadge birthDate={bn.birthDate} deathDate={bn.deathDate} />
                                    </div>
                                    {bn.spouse && (
                                      <span className="text-xs flex items-center gap-1 flex-shrink-0" style={{ color: '#8A8A8A' }}>
                                        {typeof bn.spouse === 'object' ? bn.spouse.name : bn.spouse}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )
      })}

      {/* ===== FOOTER DIVIDER ===== */}
      <div className="py-8 text-center" style={{ background: '#152238' }}>
        <div className="font-serif text-3xl italic" style={{ color: '#B8963E' }}>G</div>
        <p className="text-[11px] tracking-[6px] uppercase mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{familyTitle}</p>
      </div>
    </div>
  )
}
