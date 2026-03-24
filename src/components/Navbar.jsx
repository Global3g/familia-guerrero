import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, Heart, LogOut } from 'lucide-react'
import AdminBadge from './AdminBadge'
import NotificationBell from './NotificationBell'
import DarkModeToggle from './DarkModeToggle'
import SearchBar from './SearchBar'

export default function Navbar({ user, isAdmin, onLogout }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#FDF8F0]/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 sm:h-20">
          {/* Logo / Title */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="flex items-center gap-2 group flex-1"
          >
            <Heart
              className={`w-5 h-5 transition-colors duration-500 ${
                scrolled ? 'text-[#C4704B]' : 'text-[#FDF8F0]'
              } group-hover:text-[#B8943E]`}
              fill="currentColor"
            />
            <span
              className={`font-serif text-xl sm:text-2xl font-bold tracking-wide transition-colors duration-500 ${
                scrolled ? 'text-[#5D4037]' : 'text-[#FDF8F0]'
              }`}
            >
              Familia Guerrero
            </span>
            {user?.displayName && (
              <span className={`hidden sm:inline text-xs font-sans ml-2 transition-colors duration-500 ${scrolled ? 'text-[#5D4037]/50' : 'text-[#FDF8F0]/50'}`}>
                Hola, {user.displayName.split(' ')[0]}
                {isAdmin && <AdminBadge />}
              </span>
            )}
          </a>

          {/* Desktop Right Actions */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              <SearchBar />

              <NotificationBell />

              <DarkModeToggle />

              <button
                onClick={onLogout}
                className={`flex items-center gap-1.5 font-sans text-sm font-medium px-3 py-2 rounded-md transition-colors duration-300 ${
                  scrolled
                    ? 'text-[#C4704B] hover:bg-[#C4704B]/10'
                    : 'text-[#FDF8F0]/70 hover:text-[#FDF8F0] hover:bg-white/10'
                }`}
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          )}

          {/* Mobile Hamburger */}
          {user && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors duration-300 ${
                scrolled
                  ? 'text-[#5D4037] hover:bg-[#5D4037]/10'
                  : 'text-[#FDF8F0] hover:bg-white/10'
              }`}
              aria-label={mobileOpen ? 'Cerrar menu' : 'Abrir menu'}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && user && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="md:hidden bg-[#FDF8F0]/98 backdrop-blur-lg border-t border-[#5D4037]/10 shadow-lg"
        >
          <div className="flex flex-col px-4 py-4 gap-2">
            <SearchBar />

            {/* Notification Bell */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#5D4037]/5 transition-colors duration-200">
              <NotificationBell />
              <span className="font-sans text-base font-medium text-[#5D4037]">Notificaciones</span>
            </div>

            {/* Logout */}
            <button
              onClick={() => {
                setMobileOpen(false)
                onLogout()
              }}
              className="flex items-center gap-3 font-sans text-base font-medium text-[#C4704B] hover:bg-[#C4704B]/10 px-4 py-3 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
              Salir
            </button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
