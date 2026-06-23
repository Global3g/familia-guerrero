import { Heart, User, Users, Calendar, Home, MapPin, X, GitBranch } from 'lucide-react'
import DeceasedCross from '../utils/DeceasedCross'

const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function formatDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parseInt(parts[2])} de ${monthNames[parseInt(parts[1]) - 1]} de ${parts[0]}`
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

function Avatar({ person, size = 56, onClickPhoto }) {
  if (person?.photoURL) {
    return (
      <img
        src={person.photoURL}
        alt={person.name}
        className="rounded-full object-cover cursor-pointer hover:scale-105 transition-transform"
        style={{ width: size, height: size, border: '2px solid #B8963E' }}
        onClick={() => onClickPhoto?.({ photoURL: person.photoURL, caption: person.name })}
      />
    )
  }
  const initials = (person?.name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="rounded-full flex items-center justify-center font-serif font-semibold"
      style={{
        width: size, height: size,
        background: 'rgba(184,150,62,0.15)',
        border: '2px solid #B8963E',
        color: '#B8963E',
        fontSize: size * 0.35,
      }}
    >
      {initials}
    </div>
  )
}

function AgeBadge({ birthDate, deathDate }) {
  const age = calcAge(birthDate, deathDate)
  if (age === null) return null
  return <span className="text-xs opacity-60">{age} años</span>
}

// ponytail: single component, swim lanes layout. Bisnietos nest inside nieto cards.
export default function NucleusSwimLanes({ member, onClose, onClickPhoto }) {
  const sp = member.spouse
  const spouseName = sp ? (typeof sp === 'object' ? sp.name : sp) : null
  const children = (member.children || []).filter(Boolean)
  const wy = member.weddingDate ? member.weddingDate.split('-')[0] : null

  const getLastName = (name) => {
    if (!name) return ''
    const p = name.trim().split(' ')
    return p.length >= 3 ? p[p.length - 2] : p[p.length - 1] || p[0]
  }
  const familyTitle = `Familia ${getLastName(member.name)}`

  const totalGrandchildren = children.reduce((acc, c) => acc + (c.children ? c.children.filter(Boolean).length : 0), 0)
  const totalGreatGrandchildren = children.reduce((acc, c) => {
    return acc + (c.children ? c.children.filter(Boolean).reduce((a2, gc) => a2 + (gc.children ? gc.children.filter(Boolean).length : 0), 0) : 0)
  }, 0)

  return (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: '#F5F0E8' }}>
      {/* Header */}
      <div className="relative flex items-center justify-between px-8 py-5 flex-shrink-0" style={{
        background: '#152238',
        borderBottom: '2px solid rgba(184,150,62,0.3)'
      }}>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(184,150,62,0.15)', border: '1px solid rgba(184,150,62,0.3)' }}>
            <GitBranch className="w-5 h-5" style={{ color: '#B8963E' }} />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-white">{familyTitle}</h3>
            <p className="text-xs tracking-wider uppercase" style={{ color: '#B8963E' }}>Árbol Genealógico</p>
          </div>
        </div>
        <button onClick={onClose} className="w-11 h-11 rounded-xl flex items-center justify-center transition-all" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        <div className="py-10 px-6 sm:px-10">

          {/* Parents card */}
          <div className="flex justify-center mb-0">
            <div className="rounded-2xl px-10 py-8 text-center text-white" style={{
              background: '#152238',
              border: '2px solid rgba(184,150,62,0.3)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)'
            }}>
              <div className="flex items-center justify-center gap-8 mb-4">
                <div className="flex flex-col items-center gap-2">
                  <Avatar person={member} size={72} onClickPhoto={onClickPhoto} />
                  <div>
                    <p className="font-serif font-semibold text-lg">{member.name}<DeceasedCross deathDate={member.deathDate} /></p>
                    {member.nickname && <p className="text-sm italic" style={{ color: '#B8963E' }}>"{member.nickname}"</p>}
                    <AgeBadge birthDate={member.birthDate} deathDate={member.deathDate} />
                  </div>
                </div>
                {spouseName && (
                  <>
                    <Heart className="w-5 h-5 flex-shrink-0" style={{ color: '#B8963E', opacity: 0.5 }} />
                    <div className="flex flex-col items-center gap-2">
                      <Avatar person={typeof sp === 'object' ? sp : { name: spouseName }} size={72} onClickPhoto={onClickPhoto} />
                      <div>
                        <p className="font-serif font-semibold text-lg">{spouseName}{typeof sp === 'object' && <DeceasedCross deathDate={sp.deathDate} />}</p>
                        {typeof sp === 'object' && sp.nickname && <p className="text-sm italic" style={{ color: '#B8963E' }}>"{sp.nickname}"</p>}
                        {typeof sp === 'object' && <AgeBadge birthDate={sp.birthDate} deathDate={sp.deathDate} />}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {member.weddingDate && (
                <div className="flex items-center justify-center gap-4 text-sm opacity-70">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(member.weddingDate)}</span>
                  {member.weddingPlace && <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5" /> {member.weddingPlace}</span>}
                </div>
              )}
              <p className="text-xs mt-3 opacity-50">
                {children.length} hijos · {totalGrandchildren} nietos{totalGreatGrandchildren > 0 ? ` · ${totalGreatGrandchildren} bisnietos` : ''}
              </p>
            </div>
          </div>

          {/* Vertical connector */}
          <div className="flex justify-center">
            <div className="w-[3px] h-10" style={{ background: '#B8963E' }} />
          </div>

          {/* Swim lanes */}
          <div className="relative">
            {/* Horizontal connector bar */}
            <div className="absolute top-0 h-[3px]" style={{
              background: '#B8963E',
              left: `${100 / (children.length * 2)}%`,
              right: `${100 / (children.length * 2)}%`,
            }} />

            <div className="flex gap-4 overflow-x-auto pb-10 pt-5 justify-center" style={{ scrollbarWidth: 'thin' }}>
              {children.map((child, i) => {
                const childSp = child.spouse
                const childSpName = childSp ? (typeof childSp === 'object' ? childSp.name : childSp) : null
                const grandchildren = (child.children || []).filter(Boolean)

                return (
                  <div key={i} className="flex-1 relative pt-5" style={{ minWidth: 280, maxWidth: 340 }}>
                    {/* Vertical tick from horizontal bar */}
                    <div className="absolute top-0 left-1/2 w-[3px] h-5 -translate-x-1/2" style={{ background: '#B8963E' }} />

                    {/* Hijo card */}
                    <div className="rounded-xl p-5 text-center text-white mb-4" style={{
                      background: '#152238',
                      border: '2px solid rgba(184,150,62,0.3)',
                    }}>
                      <div className="flex justify-center mb-3">
                        <Avatar person={child} size={56} onClickPhoto={onClickPhoto} />
                      </div>
                      <p className="font-serif font-semibold">{child.name}<DeceasedCross deathDate={child.deathDate} /></p>
                      {child.nickname && <p className="text-xs italic" style={{ color: '#B8963E' }}>"{child.nickname}"</p>}
                      <AgeBadge birthDate={child.birthDate} deathDate={child.deathDate} />
                      {childSpName && <p className="text-xs opacity-60 mt-1">+ {childSpName}</p>}
                      {!childSpName && !child.spouse && <p className="text-xs opacity-40 mt-1 italic">Soltera</p>}
                    </div>

                    {/* Nietos */}
                    {grandchildren.length > 0 ? (
                      <div className="relative pl-5 ml-6" style={{ borderLeft: '3px solid #B8963E' }}>
                        {grandchildren.map((gc, gi) => {
                          const gcSp = gc.spouse
                          const gcSpName = gcSp ? (typeof gcSp === 'object' ? gcSp.name : gcSp) : null
                          const greatGrandchildren = (gc.children || []).filter(Boolean)

                          return (
                            <div key={gi} className="relative rounded-xl p-4 text-white mb-3" style={{
                              background: '#152238',
                              border: '1.5px solid rgba(184,150,62,0.25)',
                            }}>
                              {/* Horizontal connector */}
                              <div className="absolute top-1/2 -left-[23px] w-5 h-[3px] -translate-y-1/2" style={{ background: '#B8963E' }} />

                              <div className="flex items-center gap-3">
                                <Avatar person={gc} size={40} onClickPhoto={onClickPhoto} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{gc.name}<DeceasedCross deathDate={gc.deathDate} /></p>
                                  {gc.nickname && <p className="text-xs italic" style={{ color: '#B8963E' }}>"{gc.nickname}"</p>}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <AgeBadge birthDate={gc.birthDate} deathDate={gc.deathDate} />
                                    {gcSpName && <span className="text-xs opacity-50">+ {gcSpName}</span>}
                                  </div>
                                </div>
                              </div>

                              {/* Bisnietos */}
                              {greatGrandchildren.length > 0 && (
                                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(184,150,62,0.2)' }}>
                                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: '#B8963E' }}>
                                    Bisnietos ({greatGrandchildren.length})
                                  </p>
                                  {greatGrandchildren.map((bn, bi) => (
                                    <div key={bi} className="flex items-center gap-2 py-1">
                                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#B8963E' }} />
                                      <Avatar person={bn} size={24} onClickPhoto={onClickPhoto} />
                                      <span className="text-xs opacity-85">{bn.name}</span>
                                      {bn.nickname && <span className="text-[10px] italic opacity-50">"{bn.nickname}"</span>}
                                      <AgeBadge birthDate={bn.birthDate} deathDate={bn.deathDate} />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-sm italic py-4" style={{ color: '#999' }}>Sin hijos</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
