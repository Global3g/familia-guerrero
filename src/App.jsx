import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase/config'
import Login from './components/Login'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Origin from './components/Origin'
import FamilyTree from './components/FamilyTree'
import InteractiveTree from './components/InteractiveTree'
import Timeline from './components/Timeline'
import Gallery from './components/Gallery'
import Events from './components/Events'
import Memorial from './components/Memorial'
import Stats from './components/Stats'
import BirthdayHighlight from './components/BirthdayHighlight'
import Reminders from './components/Reminders'
import FamilyMap from './components/FamilyMap'
import FamilyQuotes from './components/FamilyQuotes'
import Bloodline from './components/Bloodline'
import Traditions from './components/Traditions'
import Messages from './components/Messages'
import Footer from './components/Footer'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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
      <Hero />
      <Origin />
      <FamilyTree />
      <InteractiveTree />
      <Timeline />
      <Gallery />
      <Events />
      <Memorial />
      <Stats />
      <BirthdayHighlight />
      <Reminders />
      <FamilyMap />
      <FamilyQuotes />
      <Bloodline />
      <Traditions />
      <Messages />
      <Footer />
    </div>
  )
}

export default App
