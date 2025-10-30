import Header from "../components/Header";
import Footer from "../components/Footer";
import LeadForm from "../components/LeadForm";
import TimelinePremium from "../components/TimelinePremium";

export const metadata = {
  title: "Diagnóstico Gratuito | LDC Capital",
  description:
    "Agende sua R1: conversa inicial para entender objetivos, perfil e momento de vida. Na R2 apresentamos um estudo personalizado com nossa metodologia.",
};

export default function DiagnosticoGratuitoPage() {
  return (
    <main>
      <Header />

      {/* Hero */}
      <section className="relative bg-[#262d3d] text-white py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('/images/jonas-wurster-3LwMyv3FiUE-unsplash.jpg')] bg-cover bg-center" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl lg:text-5xl font-bold mb-4">
            Diagnóstico Gratuito de Carteira (R1)
          </h1>
          <p className="text-lg lg:text-xl text-gray-200">
            Um primeiro encontro para nos conhecermos, ouvir seus objetivos e
            entender seu perfil e momento de vida. Se fizer sentido, marcamos a
            R2 para apresentar um estudo personalizado com nossa metodologia.
          </p>
        </div>
      </section>

      {/* Seção explicativa R1 / R2 */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#262d3d] mb-4">
              R1 — Análise Inicial (Gratuita)
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Conversa de diagnóstico para compreender seus objetivos, horizonte
              de investimento, tolerância a risco, experiência com investimentos
              e a fotografia atual do seu portfólio. É o momento de alinharmos
              expectativas, contexto familiar e prioridades.
            </p>
            <ul className="mt-6 space-y-2 text-gray-700">
              <li>• Entendimento do momento de vida e metas financeiras</li>
              <li>• Perfil de investidor e preferências</li>
              <li>• Situação atual da carteira e custos</li>
              <li>• Identificação de oportunidades e riscos</li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-2xl lg:text-3xl font-bold text-[#262d3d] mb-4">
              R2 — Estudo Personalizado
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Em até 7 dias, apresentamos um plano sob medida: alocação
              sugerida, melhorias de custos e tributação, rebalanceamento e
              próximos passos. Mostramos onde podemos agregar valor e como será o
              acompanhamento mensal caso decidamos seguir juntos.
            </p>
            <ul className="mt-6 space-y-2 text-gray-700">
              <li>• Carteira proposta (Brasil e exterior) e racional</li>
              <li>• Eficiência de custos e planejamento tributário</li>
              <li>• Rotina de rebalanceamento e monitoramento</li>
              <li>• Roadmap de implementação e acompanhamento</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Metodologia em 5 passos */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#262d3d] mb-3">
              Nossa Metodologia em 5 Passos
            </h2>
            <p className="text-gray-600">
              Processo estruturado e transparente para construir sua estratégia
              de investimentos
            </p>
          </div>
          <TimelinePremium />
        </div>
      </section>

      {/* Formulário reutilizado (mesmo da Home) */}
      <LeadForm />

      <Footer />
    </main>
  );
}


