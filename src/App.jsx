import { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase/config'
import { Home, GitBranch, Clock, Users, Heart, Star, Image, Calendar } from 'lucide-react'
import Login from './components/Login'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Origin from './components/Origin'
import FamilyTree from './components/FamilyTree'
import Timeline from './components/Timeline'
import Gallery from './components/Gallery'
import Events from './components/Events'
import Memorial from './components/Memorial'
import Traditions from './components/Traditions'
import Messages from './components/Messages'
import Footer from './components/Footer'
import FamilyProgress from './components/FamilyProgress'
import Dashboard from './components/Dashboard'
import Onboarding from './components/Onboarding'
import ShareExport from './components/ShareExport'
import PresentationMode, { PresentationButton } from './components/PresentationMode'
import ExportTree from './components/ExportTree'
import Gamification from './components/Gamification'
import FamilyChat from './components/FamilyChat'
import FamilyCalendar from './components/FamilyCalendar'
import WeeklyBanner from './components/WeeklyBanner'
import CoachMarks from './components/CoachMarks'
import YourBranch from './components/YourBranch'
import DigitalInvitation from './components/DigitalInvitation'
import ProgressReport from './components/ProgressReport'

// Lazy-loaded heavy components (ReactFlow, Recharts, Leaflet, etc.)
const Tree3D = lazy(() => import('./components/Tree3D'))
const InteractiveTree = lazy(() => import('./components/InteractiveTree'))
const Stats = lazy(() => import('./components/Stats'))
const FamilyMap = lazy(() => import('./components/FamilyMap'))
const BirthdayHighlight = lazy(() => import('./components/BirthdayHighlight'))
const Reminders = lazy(() => import('./components/Reminders'))
const Bloodline = lazy(() => import('./components/Bloodline'))
const FamilyQuotes = lazy(() => import('./components/FamilyQuotes'))

const tabs = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'arbol', label: 'Arbol', icon: GitBranch },
  { id: 'historia', label: 'Historia', icon: Clock },
  // { id: 'eventos', label: 'Eventos', icon: Calendar }, // ponytail: hidden per user request
  { id: 'galeria', label: 'Galeria', icon: Image },
  { id: 'familia', label: 'Familia', icon: Users },
  { id: 'homenaje', label: 'Homenaje', icon: Star },
  { id: 'recuerdos', label: 'Recuerdos', icon: Heart },
]

function App() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('inicio')
  const [showPresentation, setShowPresentation] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      // Admin check - the first registered user (gusguecas@gmail.com) is admin
      setIsAdmin(u?.email === 'gusguecas@gmail.com')
      setLoading(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const handler = (e) => {
      setActiveTab('arbol')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-family-modal', { detail: e.detail }))
      }, 500)
    }
    window.addEventListener('navigate-to-person', handler)
    return () => window.removeEventListener('navigate-to-person', handler)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <img src="/logo.svg" alt="FG" className="w-20 h-20 mx-auto mb-4" />
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-2xl font-serif font-bold italic"
            style={{ color: '#1C1C1C' }}
          >
            Familia Guerrero
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ delay: 0.6, duration: 1, ease: 'easeInOut' }}
            className="h-0.5 rounded-full mx-auto mt-3"
            style={{ backgroundColor: '#B8963E' }}
          />
        </motion.div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <div className="min-h-screen bg-cream">
      <Navbar user={user} isAdmin={isAdmin} onLogout={() => signOut(auth)} />

      {/* Tab Bar - Floating pill V2 */}
      <div className="sticky top-14 sm:top-16 z-40 flex justify-center py-4" style={{ background: 'linear-gradient(to bottom, #152238 60%, transparent)' }}>
        <nav className="inline-flex overflow-x-auto rounded-full px-3 py-3 md:px-6 md:py-4 glass-panel-static shadow-[0_10px_40px_rgba(0,0,0,0.5)]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={`relative group px-5 py-3 md:px-6 md:py-3 text-base font-sans tracking-wide whitespace-nowrap transition-all duration-200 flex-shrink-0 rounded-full ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-pill-v2"
                    className="absolute inset-0 bg-white/5 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                {!isActive && (
                  <span className="absolute inset-0 bg-white/5 rounded-full scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all" />
                )}
                <span className="relative z-10 flex items-center gap-2.5 font-medium">
                  <Icon size={22} />
                  {tab.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Onboarding */}
      <div className="max-w-[1600px] mx-auto px-4 pt-2">
        <Onboarding />
      </div>

      {/* Tab Content */}
      {activeTab === 'inicio' && (
        <motion.div
          key="inicio"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Hero />
          <Dashboard />
          <WeeklyBanner />
          <Origin />
          <YourBranch />
          {isAdmin && (
            <>
              <div className="py-16 bg-white/5">
                <ShareExport />
              </div>
              <div className="flex justify-center gap-3 py-8">
                <PresentationButton onClick={() => setShowPresentation(true)} />
                <ProgressReport />
              </div>
            </>
          )}
        </motion.div>
      )}

      {activeTab === 'arbol' && (
        <motion.div
          key="arbol"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FamilyTree />
          <div className="flex justify-center gap-3 py-4">
            <PresentationButton onClick={() => setShowPresentation(true)} />
            <ExportTree />
          </div>
          <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: '#B8963E', borderTopColor: 'transparent' }} /></div>}>
            <InteractiveTree />
          </Suspense>
          <Suspense fallback={<div className="flex justify-center py-10"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#B8963E', borderTopColor: 'transparent' }} /></div>}>
            <Tree3D />
          </Suspense>
        </motion.div>
      )}

      {activeTab === 'historia' && (
        <motion.div
          key="historia"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Timeline />
        </motion.div>
      )}

      {activeTab === 'galeria' && (
        <motion.div
          key="galeria"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Gallery />
        </motion.div>
      )}

      {activeTab === 'eventos' && (
        <motion.div
          key="eventos"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Events />
          <div className="max-w-[1600px] mx-auto px-4 py-8">
            <FamilyCalendar />
          </div>
          <DigitalInvitation />
        </motion.div>
      )}

      {activeTab === 'familia' && (
        <motion.div
          key="familia"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: '#B8963E', borderTopColor: 'transparent' }} /></div>}>
            <Stats />
            {/* ponytail: BirthdayHighlight + Reminders removed, WeeklyBanner in Inicio covers this */}
            <FamilyMap />
            <Bloodline />
            <div className="max-w-[1600px] mx-auto px-4">
              {/* ponytail: Gamification removed per user request */}
            </div>
          </Suspense>
        </motion.div>
      )}

      {activeTab === 'homenaje' && (
        <motion.div
          key="homenaje"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Memorial />
        </motion.div>
      )}

      {activeTab === 'recuerdos' && (
        <motion.div
          key="recuerdos"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: '#B8963E', borderTopColor: 'transparent' }} /></div>}>
            <FamilyQuotes />
          </Suspense>
          <Traditions />
          <Messages />
        </motion.div>
      )}

      <PresentationMode isOpen={showPresentation} onClose={() => setShowPresentation(false)} />
      <FamilyChat />
      <CoachMarks />
      <Footer />
    </div>
  )
}

export default App
