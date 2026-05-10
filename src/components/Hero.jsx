import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, ChevronDown } from "lucide-react";
import { getFamilyMembers, getGrandparents, saveGrandparents, uploadPhoto, getGalleryPhotos } from "../firebase/familyService";
import { useAuth } from "../firebase/useAuth";

function collectCount(members, grandparents) {
  let total = 0;
  let maxGen = 1;

  const gf = grandparents?.grandfather;
  const gm = grandparents?.grandmother;
  if (gf?.name) total++;
  if (gm?.name) total++;

  const walk = (person, gen) => {
    if (!person) return;
    if (person.name) {
      total++;
      if (gen > maxGen) maxGen = gen;
    }
    if (person.spouse?.name) {
      total++;
    }
    if (person.children) {
      person.children.forEach((c) => walk(c, gen + 1));
    }
  };

  if (Array.isArray(members)) {
    members.forEach((m) => walk(m, 2));
  }

  let oldestYear = 9999
  const checkYear = (date) => {
    if (!date) return
    const y = parseInt(date.split('-')[0])
    if (y > 1800 && y < oldestYear) oldestYear = y
  }
  if (gf?.birthDate) checkYear(gf.birthDate)
  if (gm?.birthDate) checkYear(gm.birthDate)

  return { total, generations: maxGen, since: oldestYear < 9999 ? oldestYear : null };
}

// Shuffle array deterministically
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Hero() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [heroPhoto, setHeroPhoto] = useState(null);
  const [collagePhotos, setCollagePhotos] = useState([]);
  const [allPhotos, setAllPhotos] = useState([]);
  const [collageKey, setCollageKey] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [members, grandparents] = await Promise.all([
          getFamilyMembers(),
          getGrandparents(),
        ]);
        const { total, generations, since } = collectCount(members, grandparents);
        setStats({ total, generations, since });
        if (grandparents?.heroPhoto) setHeroPhoto(grandparents.heroPhoto);

        // Load gallery separately to not block stats
        let gallery = []
        try {
          gallery = await getGalleryPhotos()
        } catch (e) {
          console.warn('Hero: gallery load failed', e)
        }

        // Collect photos for collage: gallery + member profile photos
        const photos = []
        gallery.forEach(p => { if (p.photoURL) photos.push(p.photoURL) })

        // Also grab profile photos from members
        const walkPhotos = (person) => {
          if (person.photoURL) photos.push(person.photoURL)
          if (person.spouse?.photoURL) photos.push(person.spouse.photoURL)
          if (person.children) person.children.forEach(walkPhotos)
        }
        members.forEach(walkPhotos)
        if (grandparents?.grandfather?.photoURL) photos.push(grandparents.grandfather.photoURL)
        if (grandparents?.grandmother?.photoURL) photos.push(grandparents.grandmother.photoURL)

        // Store all unique photos, pick 20 for display
        const unique = [...new Set(photos)]
        setAllPhotos(unique)
        setCollagePhotos(shuffle(unique).slice(0, 20))
      } catch (err) {
        console.error("Hero: could not load family stats", err);
      }
    }
    load();
  }, []);

  // Rotate collage photos every 5 minutes
  useEffect(() => {
    if (allPhotos.length === 0) return
    const interval = setInterval(() => {
      setCollagePhotos(shuffle(allPhotos).slice(0, 20))
      setCollageKey(k => k + 1)
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [allPhotos]);

  const handleHeroPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadPhoto(file, 'hero/family-photo');
    if (url) {
      await saveGrandparents({ heroPhoto: url });
      setHeroPhoto(url);
    }
  };

  return (
    <header className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 px-6 overflow-hidden">
      {/* Ambient Orbs */}
      <div className="ambient-orb orb-1" />
      <div className="ambient-orb orb-2" />
      <div className="ambient-orb orb-3" />

      {/* Photo Collage Background */}
      {collagePhotos.length > 0 && (
        <div key={collageKey} className="absolute inset-0 z-[1] overflow-hidden" style={{ pointerEvents: 'none' }}>
          <div
            className="absolute inset-0 grid grid-cols-4 md:grid-cols-5 gap-2 p-2"
            style={{ gridAutoRows: '1fr' }}
          >
            {collagePhotos.map((url, i) => (
              <motion.img
                key={url}
                src={url}
                alt=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.12 * i, duration: 1.2 }}
                className="w-full h-full object-cover rounded-xl"
              />
            ))}
          </div>
          {/* Dark overlay so text is readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/50 via-[#0F172A]/60 to-[#0F172A]/85" />
        </div>
      )}

      {/* Fallback: single hero photo */}
      {collagePhotos.length === 0 && heroPhoto && (
        <div className="absolute inset-0 z-0">
          <motion.img
            src={heroPhoto}
            alt=""
            className="w-full h-full object-cover opacity-20"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Family Crest / Shield */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-44 h-52 md:w-52 md:h-64 mb-12 mx-auto animate-float flex items-center justify-center z-10"
        style={{ filter: 'drop-shadow(0 0 40px rgba(184, 151, 106, 0.15))' }}
      >
        {/* Outermost Shield line */}
        <svg className="absolute inset-0 w-full h-full text-accent/30" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="0.5">
          <path d="M50 5 L90 20 L90 60 C90 90, 50 115, 50 115 C50 115, 10 90, 10 60 L10 20 Z" />
        </svg>
        {/* Inner Shield shape filled */}
        <svg className="absolute inset-0 w-full h-full p-2 text-base/70" viewBox="0 0 100 120" fill="currentColor">
          <path d="M50 10 L85 24 L85 62 C85 88, 50 110, 50 110 C50 110, 15 88, 15 62 L15 24 Z" />
        </svg>
        {/* Decorative interior lines */}
        <svg className="absolute inset-0 w-full h-full p-2 text-accent/40" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="0.3">
          <path d="M50 10 L85 24 L85 62 C85 88, 50 110, 50 110 C50 110, 15 88, 15 62 L15 24 Z" />
          <line x1="50" y1="10" x2="50" y2="110" />
          <line x1="15" y1="40" x2="85" y2="40" />
        </svg>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-accent/5 blur-2xl rounded-full" />
        <span className="font-serif text-7xl md:text-8xl text-accent z-10 relative tracking-tight" style={{ fontWeight: 300 }}>G</span>
      </motion.div>

      {/* Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 1 }}
        className="text-center z-10 w-full mx-auto space-y-8"
      >
        {/* Decorative line above */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '4rem' }}
          transition={{ delay: 0.6, duration: 1.2 }}
          className="decorative-line mx-auto"
        />

        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="elegant-caps text-secondary/80"
        >
          Linaje & Herencia
        </motion.h3>

        <motion.h1
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="elegant-heading text-8xl md:text-[11rem] lg:text-[13rem] text-gradient-gold px-4"
          style={{ letterSpacing: '-0.03em' }}
        >
          Familia <br /> Guerrero
        </motion.h1>

        {/* Decorative ornament */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex items-center justify-center gap-3"
        >
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-accent/30" />
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-accent/40">
            <circle cx="6" cy="6" r="2" fill="currentColor" />
          </svg>
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-accent/30" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="elegant-subheading text-2xl md:text-4xl text-white/50 max-w-4xl mx-auto px-6 leading-relaxed"
        >
          {stats?.generations > 0 ? `${stats.generations} generaciones` : 'Generaciones'} unidas por el amor, la fe y la memoria. Un legado que trasciende el tiempo.
        </motion.p>

        {/* Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="pt-8 flex items-center justify-center gap-8 md:gap-12"
          >
            {[
              { value: stats.total, label: 'Integrantes' },
              { value: stats.generations, label: 'Generaciones' },
              ...(stats.since ? [{ value: stats.since, label: 'Desde' }] : []),
            ].map((item, i) => (
              <div key={i} className="text-center glass-panel-static rounded-xl px-6 py-4">
                <p className="text-2xl sm:text-3xl font-serif font-bold text-accent">{item.value}</p>
                <p className="text-[9px] uppercase tracking-[3px] mt-1 text-white/40">{item.label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Scroll indicator */}
      <motion.a
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        whileHover={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        href="#dashboard"
        onClick={(e) => {
          e.preventDefault();
          document.querySelector('#dashboard')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center transition-opacity cursor-pointer z-10"
      >
        <span className="text-[10px] uppercase tracking-widest mb-2 font-sans text-accent">Explorar</span>
        <div className="w-px h-12 bg-gradient-to-b from-accent to-transparent" />
      </motion.a>

      {/* Photo upload */}
      {isAdmin && (
        <label className="absolute bottom-6 right-6 z-20 cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all glass-panel-static text-white/60 hover:text-white border border-white/10 hover:border-accent/40">
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cambiar foto</span>
          <input type="file" accept="image/*" onChange={handleHeroPhoto} className="hidden" />
        </label>
      )}
    </header>
  );
}
