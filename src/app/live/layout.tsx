import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Eleições 2026 | LDC Capital',
  description:
    'Live com João Paulo Machado (XP Investimentos) e o time da LDC Capital sobre o cenário das Eleições 2026 e os impactos nos investimentos. Inscreva-se gratuitamente.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Live Eleições 2026 | LDC Capital',
    description:
      'Eleições 2026: o fator que pode mudar o Brasil e seus investimentos. Live ao vivo no YouTube da LDC Capital — 06/05 às 19h.',
    type: 'website',
  },
};

export default function LiveLandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-[#f5f6f8] min-h-screen">{children}</div>;
}
