import { useState, useEffect, useRef } from 'react'
import { Search, X, User } from 'lucide-react'
import { getFamilyMembers, getGrandparents } from '../firebase/familyService'

function collectAllPeopleWithContext(members, grandparentsData) {
  const people = []

  if (grandparentsData) {
    const gf = grandparentsData.grandfather
    const gm = grandparentsData.grandmother
    if (gf?.name) people.push({ ...gf, context: 'Abuelo', generation: 1 })
    if (gm?.name) people.push({ ...gm, context: 'Abuela', generation: 1 })
  }

  const walk = (person, generation, parentName, memberName, memberId) => {
    if (person.name) {
      const ctx = parentName ? `Hijo/a de ${parentName}` : 'Familia'
      people.push({ ...person, context: ctx, generation, parentName: memberName, memberId })
    }
    if (person.spouse && typeof person.spouse === 'object' && person.spouse.name) {
      const ctx = person.name ? `Esposo/a de ${person.name}` : 'Familia'
      people.push({ ...person.spouse, context: ctx, generation, parentName: memberName, memberId })
    }
    if (person.children) {
      person.children.forEach((c) => walk(c, generation + 1, person.name, memberName, memberId))
    }
  }

  members.forEach((m) => walk(m, 2, null, m.name, m.id))
  return people
}

function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export default function SearchBar() {
  const [allPeople, setAllPeople] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadData = async () => {
    const [m, gp] = await Promise.all([getFamilyMembers(), getGrandparents()])
    const all = collectAllPeopleWithContext(m, gp)
    setAllPeople(all)
  }

  const handleSearch = (value) => {
    setQuery(value)
    if (!value.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    const q = normalize(value.trim())
    const filtered = allPeople
      .filter((p) => p.name && normalize(p.name).includes(q))
      .slice(0, 8)
    setResults(filtered)
    setOpen(filtered.length > 0)
  }

  const handleSelect = (person) => {
    // Dispatch custom event to navigate to this person in the tree
    window.dispatchEvent(new CustomEvent('navigate-to-person', {
      detail: { name: person.name, parentName: person.parentName, memberId: person.memberId }
    }))
    setOpen(false)
    setQuery('')
    setResults([])
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative max-w-md w-full">
      {/* Search input */}
      <div className="flex items-center bg-white rounded-xl shadow-lg border border-[#E0D5C8]/60 overflow-hidden px-3 py-2 gap-2 focus-within:ring-2 focus-within:ring-[#7A9E7E]/40 transition-all">
        <Search className="w-4 h-4 text-[#5D4037]/40 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder="Buscar familiar..."
          className="flex-1 text-sm text-[#5D4037] placeholder-[#5D4037]/30 outline-none bg-transparent"
        />
        {query && (
          <button onClick={handleClear} className="p-0.5 rounded-full hover:bg-[#E0D5C8]/40 transition-colors">
            <X className="w-3.5 h-3.5 text-[#5D4037]/50" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-[#E0D5C8]/60 overflow-hidden z-50 max-h-80 overflow-y-auto">
          {results.map((person, i) => (
            <button
              key={i}
              onClick={() => handleSelect(person)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAF7F2] transition-colors text-left border-b border-[#E0D5C8]/20 last:border-b-0"
            >
              {/* Photo or avatar */}
              {person.photo ? (
                <img
                  src={person.photo}
                  alt={person.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-[#E0D5C8] flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#7A9E7E]/15 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-[#7A9E7E]" />
                </div>
              )}

              {/* Info */}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#5D4037] truncate">{person.name}</p>
                <p className="text-xs text-[#5D4037]/50 truncate">{person.context}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
