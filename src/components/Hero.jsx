import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, ChevronDown } from "lucide-react";
import { getFamilyMembers, getGrandparents, saveGrandparents, uploadPhoto } from "../firebase/familyService";

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

export default function Hero() {
  const [stats, setStats] = useState(null);
  const [heroPhoto, setHeroPhoto] = useState(null);

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
      } catch (err) {
        console.error("Hero: could not load family stats", err);
      }
    }
    load();
  }, []);

  const handleHeroPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadPhoto(file, 'hero/family-photo');
    if (url) {
      await saveGrandparents({ heroPhoto: url });
      setHeroPhoto(url);
    }
  };

  const hasPhoto = !!heroPhoto;

  return (
    <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden">
      {/* === Background === */}
      {hasPhoto ? (
        <div className="absolute inset-0">
          <motion.img
            src={heroPhoto}
            alt=""
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: 'easeOut' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(28,25,23,0.3) 0%, rgba(28,25,23,0.15) 40%, rgba(28,25,23,0.7) 100%)' }} />
        </div>
      ) : (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}>
          {/* Cool ambient glows */}
          <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full opacity-[0.08] blur-[120px]" style={{ background: '#3B82F6' }} />
          <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full opacity-[0.06] blur-[100px]" style={{ background: '#6366F1' }} />
        </div>
      )}

      {/* === Content === */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center">

        {/* Overline */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 48 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="h-[1px] mb-6 bg-white/30"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-[16px] font-sans font-semibold uppercase tracking-[5px] mb-10 text-white"
        >
          Legado &amp; Memoria
        </motion.p>

        {/* Title - SAME TYPOGRAPHY */}
        <motion.h1
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif font-bold leading-[1.1] tracking-tight text-white"
          style={{ fontSize: 'clamp(5rem, 12vw, 11rem)' }}
        >
          Familia{" "}
          <span className="relative inline-block">
            Guerrero
            <span className="absolute -bottom-1 left-0 w-full h-[3px] rounded-full bg-gradient-to-r from-[#B8654A] to-[#B8654A]/20" />
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-8 font-serif text-2xl sm:text-3xl md:text-4xl italic leading-relaxed max-w-2xl text-white font-medium"
        >
          {stats?.generations > 0 ? `${stats.generations} generaciones` : 'Generaciones'} unidas por el amor, la fe y la memoria
        </motion.p>

        {/* Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-14 flex items-center gap-12"
          >
            {[
              { value: stats.total, label: 'Integrantes' },
              { value: stats.generations, label: 'Generaciones' },
              ...(stats.since ? [{ value: stats.since, label: 'Desde' }] : []),
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl sm:text-4xl font-serif font-bold text-white">{item.value}</p>
                <p className="text-[10px] uppercase tracking-[3px] mt-1 text-white/30">{item.label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5 text-white/20" />
        </motion.div>
      </motion.div>

      {/* Photo upload */}
      <label className="absolute bottom-6 right-6 z-10 cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all bg-white/10 hover:bg-white/20 text-white/40 hover:text-white/70 backdrop-blur-md border-4 border-white/80">
        <Camera className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Cambiar foto</span>
        <input type="file" accept="image/*" onChange={handleHeroPhoto} className="hidden" />
      </label>
    </section>
  );
}
