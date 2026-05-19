import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guia Gratuito para Quem Tem Patrimônio Acima de R$500k | LDC Capital',
  description:
    'O que os bankers de São Paulo compram com o próprio dinheiro — e nunca vão te oferecer. Guia gratuito da LDC Capital.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Guia Gratuito | LDC Capital',
    description:
      'O que os bankers de São Paulo compram com o próprio dinheiro — e nunca vão te oferecer.',
    type: 'website',
  },
};

export default function GuiaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark bg-[#262d3d] min-h-screen">
      {/* TODO: pixel Meta - inserir aqui */}
      {children}
    </div>
  );
}
