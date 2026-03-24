import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="relative py-20 overflow-hidden"
      style={{ backgroundColor: "#5D4037" }}
    >
      {/* Subtle warm glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30rem] h-40 rounded-full bg-[#B8943E] opacity-[0.06] blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Heart icon */}
        <Heart
          className="mx-auto mb-8 w-8 h-8 text-[#D4B96A]/60"
          fill="currentColor"
        />

        {/* Main quote */}
        <blockquote className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#FFF8F0] leading-tight">
          &ldquo;La familia no es algo importante.
          <br />
          Es todo.&rdquo;
        </blockquote>

        {/* Attribution */}
        <p className="mt-6 font-sans text-lg text-[#D4B96A]/70 tracking-wide">
          &mdash; Familia Guerrero
        </p>

        {/* Divider */}
        <div className="mx-auto my-10 w-24 h-px bg-gradient-to-r from-transparent via-[#D4B96A]/30 to-transparent" />

        {/* Legacy text */}
        <p className="font-sans text-sm text-[#FFF8F0]/40 tracking-wider">
          Familia Guerrero &mdash; Preservando nuestro legado desde 1906
        </p>
      </div>
    </footer>
  );
}
