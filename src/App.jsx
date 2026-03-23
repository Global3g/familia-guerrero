import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Origin from './components/Origin'
import FamilyTree from './components/FamilyTree'
import InteractiveTree from './components/InteractiveTree'
import FamilyProfiles from './components/FamilyProfiles'
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
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <Hero />
      <Origin />
      <FamilyTree />
      <InteractiveTree />
      <FamilyProfiles />
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
