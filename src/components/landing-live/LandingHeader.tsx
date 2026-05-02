'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LandingHeader() {
  const pathname = usePathname();
  // /live tem fundo navy escuro → texto claro; /live-confirmacao tem fundo claro → texto cinza
  const isLightBg = pathname?.startsWith('/live-confirmacao');
  const linkClasses = isLightBg
    ? 'text-[#577171] hover:text-[#98ab44]'
    : 'text-white/70 hover:text-[#98ab44]';

  return (
    <header className="absolute top-0 right-0 z-50">
      <div className="p-6 sm:p-8">
        <Link
          href="/"
          className={`${linkClasses} transition-colors text-sm font-sans font-medium`}
        >
          ← Voltar ao site
        </Link>
      </div>
    </header>
  );
}
