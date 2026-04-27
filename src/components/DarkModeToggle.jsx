import { useEffect } from 'react'

export default function DarkModeToggle() {
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('familia-dark', 'false')
  }, [])

  return null
}
