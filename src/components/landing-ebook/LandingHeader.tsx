'use client';

import Link from 'next/link';

export default function LandingHeader() {
  return (
    <header className="absolute top-0 right-0 z-50">
      {/* Apenas link de voltar no canto superior direito */}
      <div className="p-6 sm:p-8">
        <Link 
          href="/"
          className="text-white/70 hover:text-[#98ab44] transition-colors text-sm font-sans"
        >
          ← Voltar ao site
        </Link>
      </div>
    </header>
  );
}
