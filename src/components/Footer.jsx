import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="relative py-32 overflow-hidden"
      style={{ backgroundColor: '#0F172A' }}
      aria-label="Pie de pagina"
    >
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-[0.06] blur-[100px]" style={{ background: 'radial-gradient(circle, #3B82F6, transparent 70%)' }} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Small line */}
        <div className="w-8 h-[1px] bg-white/20 mx-auto mb-12" />

        {/* Main quote */}
        <blockquote className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white/90 leading-tight">
          &ldquo;La familia no es algo importante.
          <br />
          <span className="italic" style={{ color: '#C8846A' }}>Es todo.</span>&rdquo;
        </blockquote>

        {/* Heart */}
        <Heart className="mx-auto mt-12 mb-12 w-5 h-5 text-[#B8654A]/40" fill="currentColor" />

        {/* Attribution */}
        <p className="font-sans text-[11px] text-white/25 uppercase tracking-[4px]">
          Familia Guerrero &mdash; Desde 1906
        </p>
      </div>
    </footer>
  );
}
