import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: "easeOut" },
  }),
};

export default function Messages() {
  return (
    <section
      id="mensajes"
      className="relative py-24 overflow-hidden"
      style={{ backgroundColor: "#FFFEF9" }}
    >
      {/* Background warmth */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#C4704B] opacity-[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#B8943E] opacity-[0.04] blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
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
            <MessageCircle className="w-5 h-5 text-[#C4704B]" />
            <span className="font-sans text-sm tracking-widest uppercase text-[#C4704B]/70">
              Recuerdos compartidos
            </span>
            <MessageCircle className="w-5 h-5 text-[#C4704B]" />
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-[#5D4037] leading-tight">
            Voces de la Familia
          </h2>
          <p className="font-sans mt-4 text-lg text-[#5D4037]/60 max-w-xl mx-auto">
            Palabras que nacen del coraz&oacute;n y se quedan para siempre.
          </p>
        </motion.div>

        {/* Proximamente state */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          custom={0.2}
          className="max-w-md mx-auto"
        >
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#C4704B]/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-[#C4704B]/50" />
            </div>
            <p className="text-lg font-serif font-bold text-[#5D4037]/60 mb-2">Proximamente</p>
            <p className="text-sm text-[#5D4037]/40">
              Pronto podras compartir recuerdos y mensajes con toda la familia.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
