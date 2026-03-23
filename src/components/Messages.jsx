import { motion } from "framer-motion";
import { MessageCircle, User, PenLine, Send } from "lucide-react";
import { messages } from "../data/familyData";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: "easeOut" },
  }),
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const [year, month, day] = dateStr.split("-");
  return `${parseInt(day)} de ${months[parseInt(month) - 1]}, ${year}`;
}

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

        {/* Messages grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {messages.map((msg, index) => (
            <motion.article
              key={msg.id}
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={index * 0.15 + 0.2}
              className="group relative bg-[#FFF8F0]/80 backdrop-blur-sm rounded-2xl border border-[#C4704B]/10 p-6 hover:shadow-lg hover:shadow-[#C4704B]/8 hover:border-[#C4704B]/20 transition-all duration-500"
            >
              {/* Quote mark decoration */}
              <span className="absolute top-3 right-4 font-serif text-5xl text-[#C4704B]/10 leading-none select-none">
                &ldquo;
              </span>

              {/* Author header */}
              <div className="flex items-center gap-3 mb-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C4704B]/20 to-[#B8943E]/15 flex items-center justify-center flex-shrink-0">
                  {msg.photo ? (
                    <img
                      src={msg.photo}
                      alt={msg.author}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-[#5D4037]/30" />
                  )}
                </div>
                <div>
                  <h4 className="font-sans font-semibold text-sm text-[#5D4037]">
                    {msg.author}
                  </h4>
                  <p className="font-sans text-xs text-[#5D4037]/40">
                    {formatDate(msg.date)}
                  </p>
                </div>
              </div>

              {/* Message text */}
              <p className="font-sans text-[#5D4037]/75 leading-relaxed text-sm italic">
                &ldquo;{msg.message}&rdquo;
              </p>
            </motion.article>
          ))}
        </div>

        {/* Write your message area (visual only) */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          custom={0.5}
          className="mt-14 max-w-2xl mx-auto"
        >
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#B8943E]/15 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PenLine className="w-4 h-4 text-[#B8943E]" />
              <span className="font-sans text-sm font-medium text-[#5D4037]/70">
                Comparte un recuerdo o mensaje
              </span>
            </div>

            <div className="bg-[#FFFBF5] rounded-xl border border-[#B8943E]/10 p-4 min-h-[100px] flex items-start">
              <p className="font-sans text-sm text-[#5D4037]/30 italic">
                Escribe aqu&iacute; tu mensaje para la familia...
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                disabled
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C4704B]/40 to-[#B8943E]/40 text-white/70 font-sans text-sm font-medium cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </div>

            <p className="mt-3 font-sans text-xs text-[#5D4037]/30 text-center italic">
              Pr&oacute;ximamente &mdash; esta funci&oacute;n estar&aacute;
              disponible pronto.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
