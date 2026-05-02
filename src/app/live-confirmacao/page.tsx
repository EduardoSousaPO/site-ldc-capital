import LandingHeader from '@/components/landing-live/LandingHeader';
import LandingFooter from '@/components/landing-live/LandingFooter';
import ConfirmationContent from '@/components/landing-live/ConfirmationContent';

export default function LiveConfirmacaoPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#f5f6f8]">
      <LandingHeader />
      <ConfirmationContent />
      <LandingFooter />
    </main>
  );
}
