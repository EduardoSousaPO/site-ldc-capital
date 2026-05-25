import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guia Executivo | LDC Capital',
  robots: 'noindex, nofollow',
};

// Layout isolado para a página de PDF — sem navbar, footer ou scripts do site principal.
// Nota: em Next.js App Router nested layouts não podem conter <html>/<body>;
// a isolação completa do WhatsApp button é feita via CSS print na própria página.
export default function GuiaPdfLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: 0, padding: 0, background: '#f8f8f6', minHeight: '100vh' }}>
      {/* TODO: pixel Meta — não incluir nesta página de PDF */}
      {children}
    </div>
  );
}
