import { useState, useEffect, lazy, Suspense } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase/config'
import { Home, GitBranch, Clock, Users, Heart } from 'lucide-react'
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
import Onboarding from './components/Onboarding'
import ShareExport from './components/ShareExport'

// Lazy-loaded heavy components (ReactFlow, Recharts, Leaflet, etc.)
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
  { id: 'familia', label: 'Familia', icon: Users },
  { id: 'recuerdos', label: 'Recuerdos', icon: Heart },
]

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('inicio')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: '#C4704B', borderTopColor: 'transparent' }} />
          <p className="mt-3 text-sm" style={{ color: '#5D4037' }}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <div className="min-h-screen bg-cream">
      <Navbar user={user} onLogout={() => signOut(auth)} />

      {/* Tab Bar */}
      <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <nav
          className="flex overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
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
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  isActive
                    ? 'font-bold border-b-2'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={isActive ? { borderBottomColor: '#C4704B', color: '#C4704B' } : {}}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Progress bar */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <FamilyProgress />
      </div>

      {/* Onboarding */}
      <div className="max-w-4xl mx-auto px-4 pt-2">
        <Onboarding />
      </div>

      {/* Tab Content */}
      {activeTab === 'inicio' && (
        <>
          <Hero />
          <Origin />
          <ShareExport />
        </>
      )}

      {activeTab === 'arbol' && (
        <>
          <FamilyTree />
          <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: '#C4704B', borderTopColor: 'transparent' }} /></div>}>
            <InteractiveTree />
          </Suspense>
        </>
      )}

      {activeTab === 'historia' && (
        <>
          <Timeline />
          <Gallery />
          <Events />
        </>
      )}

      {activeTab === 'familia' && (
        <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: '#C4704B', borderTopColor: 'transparent' }} /></div>}>
          <Stats />
          <BirthdayHighlight />
          <Reminders />
          <FamilyMap />
          <Bloodline />
        </Suspense>
      )}

      {activeTab === 'recuerdos' && (
        <>
          <Memorial />
          <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: '#C4704B', borderTopColor: 'transparent' }} /></div>}>
            <FamilyQuotes />
          </Suspense>
          <Traditions />
          <Messages />
        </>
      )}

      <Footer />
    </div>
  )
}

export default App
