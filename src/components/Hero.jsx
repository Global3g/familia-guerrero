import { motion } from "framer-motion";
import { TreePine, Heart, ChevronDown } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, duration: 0.8, ease: "easeOut" },
  }),
};

const floatAnimation = {
  y: [0, -10, 0],
  transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
};

/* Decorative leaf SVG used in corners */
function LeafDecoration({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 110C10 110 20 60 60 30C100 0 110 10 110 10C110 10 100 60 60 90C20 120 10 110 10 110Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M10 110C10 110 40 70 60 60"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M45 82C55 72 60 60 60 60"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M30 95C45 80 60 60 60 60"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* Small branch pattern for background texture */
function BranchPattern({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 180C100 180 100 100 100 60C100 30 80 10 80 10"
        stroke="currentColor"
        strokeOpacity="0.06"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M100 100C120 80 140 75 140 75"
        stroke="currentColor"
        strokeOpacity="0.06"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M100 130C75 115 60 100 60 100"
        stroke="currentColor"
        strokeOpacity="0.06"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="80" cy="10" r="4" fill="currentColor" fillOpacity="0.05" />
      <circle cx="140" cy="75" r="3" fill="currentColor" fillOpacity="0.05" />
      <circle cx="60" cy="100" r="3" fill="currentColor" fillOpacity="0.05" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FFF8F0] via-[#FFF3E6] to-[#FDEBD3]">
      {/* ── Decorative background elements ── */}
      <LeafDecoration className="absolute top-0 left-0 w-40 md:w-56 text-[#B8943E] rotate-0 pointer-events-none" />
      <LeafDecoration className="absolute bottom-0 right-0 w-44 md:w-64 text-[#C4704B] rotate-180 pointer-events-none" />
      <BranchPattern className="absolute top-10 right-10 w-48 md:w-72 text-[#5D4037] pointer-events-none" />
      <BranchPattern className="absolute bottom-20 left-8 w-40 md:w-56 text-[#B8943E] -scale-x-100 pointer-events-none" />

      {/* Warm abstract circles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#C4704B] opacity-[0.04] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-[#B8943E] opacity-[0.05] blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-[#C4704B] opacity-[0.03] blur-[100px] pointer-events-none" />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        {/* Small icon badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-[#B8943E]/20 bg-white/50 backdrop-blur-sm"
        >
          <Heart className="w-4 h-4 text-[#C4704B]" fill="#C4704B" />
          <span className="font-sans text-sm tracking-wide text-[#5D4037]/70 uppercase">
            Nuestra Historia
          </span>
          <Heart className="w-4 h-4 text-[#C4704B]" fill="#C4704B" />
        </motion.div>

        {/* Main title */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-[#5D4037] leading-tight tracking-tight"
        >
          Familia{" "}
          <span className="relative inline-block">
            Guerrero
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[#C4704B] to-[#B8943E] rounded-full" />
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="font-sans mt-6 text-xl sm:text-2xl md:text-3xl text-[#5D4037]/80 italic max-w-2xl mx-auto leading-relaxed"
        >
          Donde nuestras ra&iacute;ces se convierten en alas
        </motion.p>

        {/* Legacy phrase */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="font-sans mt-4 text-base sm:text-lg text-[#5D4037]/60 max-w-xl mx-auto"
        >
          Generaciones unidas por el amor, la fe y la fortaleza.
          <br />
          Un legado que vive en cada uno de nosotros.
        </motion.p>

        {/* Photo placeholder */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3.5}
          className="mt-10 mx-auto w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-[#C4704B]/20 via-[#B8943E]/15 to-[#5D4037]/10 border-4 border-white/60 shadow-xl flex items-center justify-center"
        >
          <TreePine className="w-16 h-16 sm:w-20 sm:h-20 text-[#5D4037]/30" />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#arbol"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#C4704B] to-[#B8943E] text-white font-sans font-semibold text-lg shadow-lg shadow-[#C4704B]/25 hover:shadow-xl hover:shadow-[#C4704B]/30 hover:scale-105 transition-all duration-300"
          >
            <TreePine className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Ver &aacute;rbol familiar
          </a>
          <a
            href="#galeria"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-[#5D4037]/20 text-[#5D4037] font-sans font-semibold text-lg hover:bg-[#5D4037]/5 hover:border-[#5D4037]/30 hover:scale-105 transition-all duration-300 backdrop-blur-sm"
          >
            <Heart className="w-5 h-5 group-hover:scale-110 transition-transform text-[#C4704B]" />
            Explorar recuerdos
          </a>
        </motion.div>
      </div>

      {/* ── Floating scroll indicator ── */}
      <motion.a
        href="#arbol"
        animate={floatAnimation}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-[#5D4037]/40 hover:text-[#5D4037]/70 transition-colors cursor-pointer"
      >
        <span className="font-sans text-xs tracking-widest uppercase">Descubre</span>
        <ChevronDown className="w-6 h-6" />
      </motion.a>
    </section>
  );
}
