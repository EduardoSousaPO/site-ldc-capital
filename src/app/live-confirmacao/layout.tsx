import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscrição confirmada | Live Eleições 2026 | LDC Capital',
  description:
    'Sua inscrição na live da LDC Capital sobre Eleições 2026 foi confirmada. Ative o lembrete no YouTube para não perder.',
  robots: 'noindex, nofollow',
};

export default function LiveConfirmacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-[#f5f6f8] min-h-screen">{children}</div>;
}
