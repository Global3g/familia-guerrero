import { motion } from 'framer-motion';
import { User, Heart, Users, Baby, Camera } from 'lucide-react';
import { children } from '../data/familyData';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

function ProfileCard({ member }) {
  return (
    <motion.div
      variants={cardVariants}
      className="rounded-2xl shadow-lg overflow-hidden bg-[#FFFDF7] border border-[#E8D5C4]"
    >
      {/* Photo placeholder */}
      <div className="relative h-56 bg-gradient-to-br from-[#C4704B]/20 via-[#7A9E7E]/15 to-[#5D4037]/10 flex items-center justify-center">
        {member.photo ? (
          <img
            src={member.photo}
            alt={member.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#5D4037]/40">
            <Camera size={48} strokeWidth={1.2} />
            <span className="text-sm font-medium tracking-wide uppercase">Foto</span>
          </div>
        )}
        {/* Overlay name badge */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#5D4037]/70 to-transparent pt-10 pb-4 px-5">
          <h3 className="text-xl font-serif font-bold text-white leading-tight">
            {member.fullName}
          </h3>
          {member.nickname && (
            <p className="text-[#FAEBD7] text-sm italic mt-0.5">
              &ldquo;{member.nickname}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 space-y-3">
        {/* Role */}
        {member.role && (
          <div className="flex items-center gap-2 text-[#5D4037]">
            <User size={16} className="text-[#C4704B] flex-shrink-0" />
            <span className="text-sm font-medium">{member.role}</span>
          </div>
        )}

        {/* Spouse */}
        {member.spouse && (
          <div className="flex items-center gap-2 text-[#5D4037]">
            <Heart size={16} className="text-[#C4704B] flex-shrink-0" />
            <span className="text-sm">
              Casado(a) con <span className="font-semibold">{member.spouse}</span>
            </span>
          </div>
        )}

        {/* Children count */}
        {member.childrenCount !== undefined && member.childrenCount > 0 && (
          <div className="flex items-center gap-2 text-[#5D4037]">
            <Baby size={16} className="text-[#7A9E7E] flex-shrink-0" />
            <span className="text-sm">
              {member.childrenCount} {member.childrenCount === 1 ? 'hijo(a)' : 'hijos(as)'}
            </span>
          </div>
        )}

        {/* Bio */}
        {member.bio && (
          <p className="text-sm text-[#5D4037]/80 leading-relaxed pt-2 border-t border-[#E8D5C4]/60">
            {member.bio}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function FamilyProfiles() {
  return (
    <section
      id="perfiles"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFF8F0]"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users size={28} className="text-[#7A9E7E]" />
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#5D4037] tracking-tight">
            Nuestra Familia
          </h2>
          <div className="mt-4 mx-auto w-24 h-1 rounded-full bg-gradient-to-r from-[#C4704B] to-[#7A9E7E]" />
        </motion.div>

        {/* Profiles grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {children.map((member, index) => (
            <ProfileCard key={member.id || index} member={member} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
