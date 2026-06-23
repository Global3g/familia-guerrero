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

        // Store all unique photos. Mostramos menos en mobile para que cargue rápido.
        const unique = [...new Set(photos)]
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
        const limit = isMobile ? 9 : 15
        setAllPhotos(unique)
        setCollagePhotos(shuffle(unique).slice(0, limit))
      } catch (err) {
        console.error("Hero: could not load family stats", err);
      }
    }
    load();
  }, []);

  // Rotate collage photos every 5 minutes
  useEffect(() => {
    if (allPhotos.length === 0) return
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const limit = isMobile ? 9 : 15
    const interval = setInterval(() => {
      setCollagePhotos(shuffle(allPhotos).slice(0, limit))
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
    <header className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 px-6 overflow-hidden" style={{ backgroundColor: '#FFFDF7' }}>
      {/* Color bar top */}
      <div className="absolute top-0 left-0 right-0 h-[6px] z-20" style={{ background: 'linear-gradient(90deg, #152238 25%, #B8963E 25%, #B8963E 50%, #7A2841 50%, #7A2841 75%, #5B7E6B 75%)' }} />

      {/* Ambient Orbs - subtle */}
      <div className="ambient-orb orb-1" />
      <div className="ambient-orb orb-2" />

      {/* Photo Collage Background - subtle on light */}
      {collagePhotos.length > 0 && (
        <div key={collageKey} className="absolute inset-0 z-[1] overflow-hidden" style={{ pointerEvents: 'none' }}>
          <div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-2 content-start">
            {collagePhotos.map((url, i) => (
              <motion.img
                key={url}
                src={url}
                alt=""
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ delay: 0.12 * i, duration: 1.2 }}
                className="w-full aspect-square object-cover rounded-xl"
                style={{ opacity: 0.9 }}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-[#FFFDF7]/35" />
        </div>
      )}

      {/* Fallback: single hero photo */}
      {collagePhotos.length === 0 && heroPhoto && (
        <div className="absolute inset-0 z-0">
          <motion.img
            src={heroPhoto}
            alt=""
            className="w-full h-full object-cover opacity-10"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 1 }}
        className="text-center z-10 w-full mx-auto space-y-6"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-[13px] font-sans tracking-[8px] uppercase"
          style={{ color: '#B8963E' }}
        >
          Familia
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-7xl md:text-[9rem] lg:text-[11rem] italic px-4"
          style={{ color: '#1C1C1C', fontWeight: 400, lineHeight: 0.9 }}
        >
          Guerrero
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="text-[13px] font-sans tracking-[5px] uppercase"
          style={{ color: '#8A8A8A' }}
        >
          Tres generaciones · Un legado
        </motion.p>

        {/* Decorative ornament */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex items-center justify-center gap-3 py-2"
        >
          <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, transparent, #B8963E, transparent)' }} />
          <span style={{ color: '#B8963E', fontSize: '14px' }}>❦</span>
          <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, transparent, #B8963E, transparent)' }} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="font-serif italic text-xl md:text-2xl max-w-xl mx-auto px-6 leading-relaxed"
          style={{ color: '#8A8A8A' }}
        >
          {stats?.generations > 0 ? `${stats.generations} generaciones` : 'Generaciones'} unidas por el amor, la fe y la memoria
        </motion.p>
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
        <span className="text-[10px] uppercase tracking-widest mb-2 font-sans" style={{ color: '#B8963E' }}>Explorar</span>
        <div className="w-px h-12" style={{ background: 'linear-gradient(to bottom, #B8963E, transparent)' }} />
      </motion.a>

      {/* Photo upload */}
      {isAdmin && (
        <label className="absolute bottom-6 right-6 z-20 cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all border" style={{ color: '#8A8A8A', borderColor: '#B8963E30' }}>
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cambiar foto</span>
          <input type="file" accept="image/*" onChange={handleHeroPhoto} className="hidden" />
        </label>
      )}
    </header>
  );
}
