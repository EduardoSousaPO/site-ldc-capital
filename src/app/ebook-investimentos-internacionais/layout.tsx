import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'E-book Investimentos Internacionais | LDC Capital',
  description: 'Baixe gratuitamente o e-book sobre Investimentos Internacionais e aprenda estratégias exclusivas para diversificar seu patrimônio globalmente.',
  robots: 'noindex, nofollow', // Página oculta - não indexar
  openGraph: {
    title: 'E-book Investimentos Internacionais | LDC Capital',
    description: 'Guia completo sobre investimentos internacionais para diversificação patrimonial.',
    type: 'website',
  },
};

export default function EbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark bg-[#262d3d] min-h-screen">
      {children}
    </div>
  );
}
