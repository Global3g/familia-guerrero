import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Baby, Star, Users } from 'lucide-react';
import { getFamilyMembers, getGrandparents, getTimelineEvents } from '../firebase/familyService';
import formatDate from '../utils/formatDate';

const typeConfig = {
  nacimiento: {
    color: '#6B9080',
    gradient: 'from-[#6B9080] to-[#5a7e5e]',
    icon: Baby,
    label: 'Nacimiento',
  },
  boda: {
    color: '#B8654A',
    gradient: 'from-[#B8654A] to-[#a4553a]',
    icon: Heart,
    label: 'Boda',
  },
  memorial: {
    color: '#B8976A',
    gradient: 'from-[#B8976A] to-[#98742e]',
    icon: Star,
    label: 'Memorial',
  },
  reunion: {
    color: '#FFFFFF',
    gradient: 'from-[#0F172A] to-[#1a252f]',
    icon: Users,
    label: 'Reunion',
  },
  aniversario: {
    color: '#C8846A',
    gradient: 'from-[#C8846A] to-[#c8754d]',
    icon: Heart,
    label: 'Aniversario',
  },
};

const defaultConfig = {
  color: '#FFFFFF',
  gradient: 'from-[#0F172A] to-[#3e2a25]',
  icon: Star,
  label: 'Evento',
};

export default function HorizontalTimeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    // Delay to ensure DOM has rendered the scroll container
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [events]);

  const loadEvents = async () => {
    setLoading(true);
    const [manual, members, gp] = await Promise.all([
      getTimelineEvents(),
      getFamilyMembers(),
      getGrandparents(),
    ]);

    const auto = [];

    // Grandparents births and wedding
    if (gp) {
      const gf = gp.grandfather;
      const gm = gp.grandmother;
      if (gf?.birthDate)
        auto.push({
          year: parseInt(gf.birthDate.split('-')[0]),
          date: gf.birthDate,
          title: `Nace ${gf.fullName || gf.name}`,
          description: gf.role || 'Patriarca',
          type: 'nacimiento',
          _auto: true,
        });
      if (gm?.birthDate)
        auto.push({
          year: parseInt(gm.birthDate.split('-')[0]),
          date: gm.birthDate,
          title: `Nace ${gm.fullName || gm.name}`,
          description: gm.role || 'Matriarca',
          type: 'nacimiento',
          _auto: true,
        });
      if (gp.weddingDate)
        auto.push({
          year: parseInt(gp.weddingDate.split('-')[0]),
          date: gp.weddingDate,
          title: `Boda de ${(gf?.name || 'Abuelo').split(' ')[0]} y ${(gm?.name || 'Abuela').split(' ')[0]}`,
          description: gp.weddingPlace || '',
          type: 'boda',
          _auto: true,
        });
      if (gf?.deathDate)
        auto.push({
          year: parseInt(gf.deathDate.split('-')[0]),
          date: gf.deathDate,
          title: `Partida de ${gf.fullName || gf.name}`,
          description: '',
          type: 'memorial',
          _auto: true,
        });
      if (gm?.deathDate)
        auto.push({
          year: parseInt(gm.deathDate.split('-')[0]),
          date: gm.deathDate,
          title: `Partida de ${gm.fullName || gm.name}`,
          description: '',
          type: 'memorial',
          _auto: true,
        });
    }

    // Walk all members recursively
    const walk = (person) => {
      if (person.birthDate) {
        auto.push({
          year: parseInt(person.birthDate.split('-')[0]),
          date: person.birthDate,
          title: `Nace ${person.name}`,
          description: '',
          type: 'nacimiento',
          _auto: true,
        });
      }
      if (person.deathDate) {
        auto.push({
          year: parseInt(person.deathDate.split('-')[0]),
          date: person.deathDate,
          title: `Partida de ${person.name}`,
          description: '',
          type: 'memorial',
          _auto: true,
        });
      }
      if (person.weddingDate && person.spouse) {
        const spouseName =
          typeof person.spouse === 'object' ? person.spouse.name : person.spouse;
        auto.push({
          year: parseInt(person.weddingDate.split('-')[0]),
          date: person.weddingDate,
          title: `Boda de ${person.name?.split(' ')[0]} y ${spouseName?.split(' ')[0]}`,
          description: person.weddingPlace || '',
          type: 'boda',
          _auto: true,
        });
      }
      if (
        person.spouse &&
        typeof person.spouse === 'object' &&
        person.spouse.birthDate
      ) {
        auto.push({
          year: parseInt(person.spouse.birthDate.split('-')[0]),
          date: person.spouse.birthDate,
          title: `Nace ${person.spouse.name}`,
          description: '',
          type: 'nacimiento',
          _auto: true,
        });
      }
      if (person.children) person.children.forEach((c) => walk(c));
    };
    members.forEach((m) => walk(m));

    // Merge: manual events take priority
    const normalize = (s) =>
      s
        ?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    const manualTitles = new Set(manual.map((m) => normalize(m.title)));
    const uniqueAuto = auto.filter((a) => !manualTitles.has(normalize(a.title)));

    const all = [...manual, ...uniqueAuto].sort(
      (a, b) => (a.year || 0) - (b.year || 0)
    );
    setEvents(all);
    setLoading(false);
  };

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 300;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleScroll = () => {
    checkScroll();
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0F172A' }}>
      <div className="max-w-7xl mx-auto">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-[11px] font-sans font-medium uppercase tracking-[5px] text-white/40 mb-4">Linea del tiempo</p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-5">
            Momentos Clave
          </h2>
          <div className="w-8 h-[1px] bg-[#B8654A] mx-auto mb-5" />
          <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
            Un recorrido por los eventos mas importantes de nuestra familia.
          </p>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div className="flex gap-6 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[280px] h-[320px] rounded-2xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Scroll container with arrows */}
        {!loading && events.length > 0 && (
          <div className="relative group">
            {/* Left arrow */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 shadow-lg border-4 border-white/80 flex items-center justify-center text-white/50 hover:bg-white/20 hover:shadow-xl transition -ml-2 backdrop-blur-sm"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            {/* Right arrow */}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 shadow-lg border-4 border-white/80 flex items-center justify-center text-white/50 hover:bg-white/20 hover:shadow-xl transition -mr-2 backdrop-blur-sm"
              >
                <ChevronRight size={22} />
              </button>
            )}

            {/* Scrollable row */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-6 overflow-x-auto pb-4 px-1 hide-scrollbar"
              style={{
                scrollBehavior: 'smooth',
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
              `}</style>
              {events.map((event, index) => {
                const config = typeConfig[event.type] || defaultConfig;
                const IconComponent = config.icon;

                return (
                  <motion.div
                    key={event.id || `auto-${index}`}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
                    className="flex-shrink-0 w-[280px] h-[320px] rounded-2xl shadow-lg overflow-hidden cursor-default hover:shadow-xl transition-shadow duration-300 bg-white/5 border-4 border-white/80"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    {/* Top half: gradient or photo */}
                    <div
                      className={`relative h-[140px] bg-gradient-to-br ${config.gradient} flex items-center justify-center overflow-hidden`}
                    >
                      {event.photoURL ? (
                        <img
                          src={event.photoURL}
                          alt={event.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <IconComponent
                          size={48}
                          className="text-white/20"
                          strokeWidth={1.5}
                        />
                      )}

                      {/* Type badge */}
                      <span
                        className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shadow-md"
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        <IconComponent size={11} />
                        {config.label}
                      </span>
                    </div>

                    {/* Bottom half: content */}
                    <div className="h-[180px] bg-transparent p-5 flex flex-col">
                      {/* Year */}
                      <span
                        className="text-3xl font-serif font-bold leading-none mb-1 text-white"
                      >
                        {event.year}
                      </span>

                      {/* Date */}
                      {event.date && (
                        <p className="text-[11px] text-white/50 tracking-wide uppercase mb-2">
                          {formatDate(event.date)}
                        </p>
                      )}

                      {/* Title */}
                      <h3 className="font-serif text-base font-bold text-white leading-snug line-clamp-2 mb-1">
                        {event.title}
                      </h3>

                      {/* Description */}
                      {event.description && (
                        <p className="text-xs text-white/50 leading-relaxed line-clamp-2 mt-auto">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && events.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-lg font-serif font-bold text-white/60">
              Sin momentos clave todavia
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
