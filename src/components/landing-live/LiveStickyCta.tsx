'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

export default function LiveStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const maxScroll = el.scrollHeight - window.innerHeight;
      const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      setVisible(ratio >= 0.3);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[35] transition-opacity duration-300 ease-out md:hidden ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <div className="border-t border-[#262d3d]/15 bg-[#0a1628]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_rgba(38,45,61,0.18)] backdrop-blur-sm">
        <Link
          href="#formulario"
          onClick={() => trackEvent('cta_click', 'live', 'sticky_mobile_inscreva-se')}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#98ab44] px-4 py-3.5 font-sans text-sm font-bold uppercase tracking-wider text-[#262d3d] shadow-lg shadow-[#98ab44]/25 transition-colors hover:bg-[#becc6a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#98ab44]"
        >
          INSCREVA-SE NA LIVE
        </Link>
      </div>
    </div>
  );
}
