import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  Music,
  Camera,
  ChefHat,
  Wine,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { traditions, familyValues } from "../data/familyData";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: "easeOut" },
  }),
};

const iconMap = {
  utensils: UtensilsCrossed,
  music: Music,
  camera: Camera,
  "chef-hat": ChefHat,
  wine: Wine,
  scroll: ScrollText,
};

export default function Traditions() {
  return (
    <section
      id="tradiciones"
      className="relative py-24 overflow-hidden"
      style={{ backgroundColor: "#FFFDF7" }}
    >
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-[#7A9E7E] opacity-[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#C4704B] opacity-[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-[#B8943E] opacity-[0.03] blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          custom={0}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-[#B8943E]" />
            <span className="font-sans text-sm tracking-widest uppercase text-[#7A9E7E]">
              Lo que nos define
            </span>
            <Sparkles className="w-5 h-5 text-[#B8943E]" />
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-[#5D4037] leading-tight">
            Tradiciones y Valores
          </h2>
          <p className="font-sans mt-4 text-lg text-[#5D4037]/60 max-w-xl mx-auto">
            Las costumbres que nos unen y los principios que nos gu&iacute;an.
          </p>
        </motion.div>

        {/* Traditions grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-20">
          {traditions.map((tradition, index) => {
            const IconComponent = iconMap[tradition.icon] || Sparkles;
            return (
              <motion.article
                key={tradition.title}
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={index * 0.15 + 0.2}
                className="group bg-white/60 backdrop-blur-sm rounded-2xl border border-[#7A9E7E]/15 p-6 hover:shadow-lg hover:shadow-[#7A9E7E]/10 hover:border-[#7A9E7E]/25 transition-all duration-500"
              >
                {/* Icon */}
                <div className="mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-[#7A9E7E]/15 to-[#B8943E]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-6 h-6 text-[#C4704B]" />
                </div>

                {/* Title */}
                <h3 className="font-serif text-xl font-bold text-[#5D4037] mb-2">
                  {tradition.title}
                </h3>

                {/* Description */}
                <p className="font-sans text-sm text-[#5D4037]/70 leading-relaxed">
                  {tradition.description}
                </p>
              </motion.article>
            );
          })}
        </div>

        {/* Values section */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          custom={0}
          className="text-center"
        >
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#5D4037] mb-8">
            Nuestros Valores
          </h3>

          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {familyValues.map((value, index) => (
              <motion.span
                key={value}
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={index * 0.1 + 0.1}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 border border-[#B8943E]/20 font-sans text-sm font-medium text-[#5D4037]/80 hover:bg-[#B8943E]/10 hover:border-[#B8943E]/30 transition-colors duration-300 backdrop-blur-sm shadow-sm"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      index % 3 === 0
                        ? "#7A9E7E"
                        : index % 3 === 1
                          ? "#C4704B"
                          : "#B8943E",
                  }}
                />
                {value}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
