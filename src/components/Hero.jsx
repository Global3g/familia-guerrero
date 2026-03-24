import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { getFamilyMembers, getGrandparents, saveGrandparents, uploadPhoto } from "../firebase/familyService";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.25, duration: 0.7, ease: "easeOut" },
  }),
};

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

  // Find oldest birth year
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
        const { total, generations } = collectCount(members, grandparents);
        setStats({ total, generations });
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

  return (
    <section
      className={`relative flex items-center justify-center overflow-hidden max-h-[80vh] min-h-[60vh] py-20 ${!heroPhoto ? 'bg-gradient-to-b from-[#FDF8F0] via-[#FEF3E2] to-[#FDEBD3]' : ''}`}
      style={heroPhoto ? {
        backgroundImage: `linear-gradient(rgba(93,64,55,0.6), rgba(93,64,55,0.7)), url(${heroPhoto})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Title */}
        <motion.h1
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={0}
          className={`font-serif text-7xl sm:text-8xl md:text-9xl font-bold leading-[1.1] tracking-tight ${heroPhoto ? 'text-white' : 'text-[#5D4037]'}`}
        >
          Familia{" "}
          <span className="relative inline-block">
            Guerrero
            <span className={`absolute -bottom-1 left-0 w-full h-[3px] rounded-full ${heroPhoto ? 'bg-gradient-to-r from-white/80 to-white/30' : 'bg-gradient-to-r from-[#C4704B] to-[#C4704B]/40'}`} />
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={1}
          className={`mt-6 font-serif text-lg sm:text-xl md:text-2xl italic leading-relaxed max-w-xl mx-auto ${heroPhoto ? 'text-white/80' : 'text-[#5D4037]/75'}`}
        >
          {stats?.generations > 0 ? `${stats.generations} generaciones` : 'Generaciones'} unidas por el amor, la fe y la memoria
        </motion.p>

        {/* Stats counter */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={2}
          className={`mt-8 flex items-center justify-center gap-3 text-sm sm:text-base tracking-wide ${heroPhoto ? 'text-white/60' : 'text-[#5D4037]/55'}`}
        >
          {stats ? (
            <>
              <span className={`font-semibold ${heroPhoto ? 'text-white/80' : 'text-[#5D4037]/70'}`}>{stats.total}</span>
              <span>integrantes</span>
              <span className={heroPhoto ? 'text-white/30' : 'text-[#C4704B]/40'}>·</span>
              <span className={`font-semibold ${heroPhoto ? 'text-white/80' : 'text-[#5D4037]/70'}`}>{stats.generations}</span>
              <span>generaciones</span>
              <span className={heroPhoto ? 'text-white/30' : 'text-[#C4704B]/40'}>·</span>
              <span>Desde {stats.since || '...'}</span>
            </>
          ) : (
            <span className={heroPhoto ? 'text-white/30' : 'text-[#5D4037]/30'}>Cargando...</span>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={3}
          className="mt-10"
        >
          <a
            href="#arbol"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#C4704B] text-white font-sans font-semibold text-base shadow-md shadow-[#C4704B]/20 hover:shadow-lg hover:shadow-[#C4704B]/30 hover:bg-[#b5613e] transition-all duration-300"
          >
            Explorar nuestra historia
          </a>
        </motion.div>
      </div>

      {/* Photo upload button */}
      <label className="absolute bottom-4 right-4 cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white/70 text-xs transition backdrop-blur-sm">
        <Camera className="w-3.5 h-3.5" />
        Cambiar foto
        <input type="file" accept="image/*" onChange={handleHeroPhoto} className="hidden" />
      </label>
    </section>
  );
}
