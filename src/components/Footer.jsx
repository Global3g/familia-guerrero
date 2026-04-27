import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="border-t border-white/5 bg-[#0F172A] relative z-20 py-12"
      aria-label="Pie de pagina"
    >
      <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Logo & Title */}
        <div className="flex flex-col items-center md:items-start">
          <div className="font-serif text-2xl text-white mb-1 flex items-center space-x-2">
            <svg className="w-5 h-5 text-accent" viewBox="0 0 100 120" fill="currentColor">
              <path d="M50 10 L85 24 L85 62 C85 88, 50 110, 50 110 C50 110, 15 88, 15 62 L15 24 Z" />
            </svg>
            <span>Fam. Guerrero</span>
          </div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest">Archivo Genealógico Privado</p>
        </div>

        {/* Links */}
        <div className="flex space-x-6 text-sm font-sans text-white/60">
          <a href="#" className="hover:text-accent transition-colors">Solicitar Acceso</a>
          <a href="#" className="hover:text-accent transition-colors">Normas del Archivo</a>
          <a href="#" className="hover:text-accent transition-colors">Contacto Administrador</a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-white/30 font-sans">
          &copy; {new Date().getFullYear()} El Legado Continúa.
        </div>
      </div>
    </footer>
  );
}
