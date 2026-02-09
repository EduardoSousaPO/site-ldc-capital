import Header from "../components/Header";
import Footer from "../components/Footer";
import LeadForm from "../components/LeadForm";
import TeamGrid from "../components/TeamGrid";
import CTAButton from "../components/CTAButton";

export const metadata = {
  title: "Nossa Equipe - LDC Capital",
  description:
    "Conheça os consultores certificados da LDC Capital. Profissionais experientes e dedicados a cuidar do seu patrimônio com transparência e excelência.",
  openGraph: {
    title: "Nossa Equipe - LDC Capital",
    description:
      "Conheça os consultores certificados da LDC Capital. Profissionais experientes e dedicados a cuidar do seu patrimônio.",
    type: "website",
  },
};

export default function EquipePage() {
  return (
    <main>
      <Header />

      {/* Hero Section */}
      <section className="relative bg-[#262d3d] overflow-hidden pt-32 lg:pt-40 xl:pt-44 2xl:pt-48 pb-16 lg:pb-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
                               radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 2px, transparent 2px)`,
              backgroundSize: "60px 60px",
            }}
          ></div>
        </div>

        {/* Elementos decorativos */}
        <div className="absolute top-20 right-10 w-32 h-32 border-2 border-white/20 rounded-full animate-pulse hidden lg:block"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 border border-white/10 rounded-full animate-pulse delay-1000 hidden lg:block"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Subtítulo */}
          <p className="font-serif text-white text-lg md:text-xl lg:text-2xl font-medium tracking-wide mb-6">
            EQUIPE LDC CAPITAL
          </p>

          {/* Título */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Conheça <span className="text-[#98ab44]">nossa equipe</span>
          </h1>
        </div>
      </section>

      {/* Grid de Consultores */}
      <TeamGrid showDescriptions={true} />

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-[#98ab44] to-[#becc6a] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-6">
            Pronto para dar o próximo passo?
          </h2>

          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Nossa equipe está preparada para analisar seu perfil e desenvolver
            uma estratégia personalizada para seus investimentos.
          </p>

          <div className="mb-6">
            <CTAButton
              size="lg"
              className="bg-white text-[#98ab44] hover:bg-white/90 px-10 py-5 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Fale com a nossa Equipe
            </CTAButton>
          </div>

          <p className="text-sm text-white/80 mt-6">
            Análise gratuita • Sem compromisso • Atendimento em todo o Brasil
          </p>
        </div>
      </section>

      {/* Formulário de Contato */}
      <LeadForm />

      <Footer />
    </main>
  );
}
