import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getFamilyMembers, getGrandparents } from "../firebase/familyService";

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

  return { total, generations: maxGen };
}

export default function Hero() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [members, grandparents] = await Promise.all([
          getFamilyMembers(),
          getGrandparents(),
        ]);
        const { total, generations } = collectCount(members, grandparents);
        setStats({ total, generations });
      } catch (err) {
        console.error("Hero: could not load family stats", err);
      }
    }
    load();
  }, []);

  return (
    <section className="relative flex items-center justify-center overflow-hidden max-h-[80vh] min-h-[60vh] py-20 bg-gradient-to-b from-[#FDF8F0] via-[#FEF3E2] to-[#FDEBD3]">
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Title */}
        <motion.h1
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={0}
          className="font-serif text-6xl sm:text-7xl md:text-8xl font-bold text-[#5D4037] leading-[1.1] tracking-tight"
        >
          Familia{" "}
          <span className="relative inline-block">
            Guerrero
            <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-gradient-to-r from-[#C4704B] to-[#C4704B]/40 rounded-full" />
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={1}
          className="mt-6 font-serif text-lg sm:text-xl md:text-2xl text-[#5D4037]/75 italic leading-relaxed max-w-xl mx-auto"
        >
          {stats?.generations > 0 ? `${stats.generations} generaciones` : 'Generaciones'} unidas por el amor, la fe y la memoria
        </motion.p>

        {/* Stats counter */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mt-8 flex items-center justify-center gap-3 text-[#5D4037]/55 text-sm sm:text-base tracking-wide"
        >
          {stats ? (
            <>
              <span className="font-semibold text-[#5D4037]/70">{stats.total}</span>
              <span>integrantes</span>
              <span className="text-[#C4704B]/40">·</span>
              <span className="font-semibold text-[#5D4037]/70">{stats.generations}</span>
              <span>generaciones</span>
              <span className="text-[#C4704B]/40">·</span>
              <span>Desde 1948</span>
            </>
          ) : (
            <span className="text-[#5D4037]/30">Cargando...</span>
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
    </section>
  );
}
