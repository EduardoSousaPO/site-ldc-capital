import LandingHeader from '@/components/landing-ebook/LandingHeader';
import HeroSection from '@/components/landing-ebook/HeroSection';
import BenefitsSection from '@/components/landing-ebook/BenefitsSection';
import FormSection from '@/components/landing-ebook/FormSection';
import LandingFooter from '@/components/landing-ebook/LandingFooter';

export default function EbookLandingPage() {
  return (
    <main className="min-h-screen bg-[#0a1628]">
      <LandingHeader />
      <HeroSection />
      <BenefitsSection />
      <FormSection />
      <LandingFooter />
    </main>
  );
}
