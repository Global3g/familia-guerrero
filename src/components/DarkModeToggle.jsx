import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('familia-dark') === 'true')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('familia-dark', dark)
  }, [dark])

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2 rounded-full hover:bg-[#5D4037]/10 transition"
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
    >
      {dark ? <Sun className="w-5 h-5 text-[#B8943E]" /> : <Moon className="w-5 h-5 text-[#5D4037]" />}
    </button>
  )
}
