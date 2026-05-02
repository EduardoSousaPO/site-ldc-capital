import LandingHeader from '@/components/landing-live/LandingHeader';
import HeroSection from '@/components/landing-live/HeroSection';
import InfoFormSection from '@/components/landing-live/InfoFormSection';
import LandingFooter from '@/components/landing-live/LandingFooter';
import LiveStickyCta from '@/components/landing-live/LiveStickyCta';

export default function LiveLandingPage() {
  return (
    <main className="min-h-screen bg-[#f5f6f8] pb-24 md:pb-0">
      <LandingHeader />
      <HeroSection />
      <InfoFormSection />
      <LandingFooter />
      <LiveStickyCta />
    </main>
  );
}
