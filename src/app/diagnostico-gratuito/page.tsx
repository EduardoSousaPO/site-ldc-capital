import Header from "../components/Header";
import Footer from "../components/Footer";
import LeadForm from "../components/LeadForm";

export const metadata = {
  title: "Diagnóstico Gratuito | LDC Capital",
  description:
    "Agende sua R1 gratuita: entendemos seus objetivos e perfil para preparar um plano personalizado (R2).",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DiagnosticoGratuitoPage() {
  return (
    <main>
      <Header />

      {/* Seção principal: formulário acima da dobra */}
      <LeadForm title="Sua Carteira Avaliada por Especialistas — Sem Custo" />

      {/* Como funciona (curto e direto) */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#262d3d]">
              Como funciona
            </h2>
            <p className="text-gray-600 mt-2">
              Processo em duas etapas, sem custo e sem compromisso.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="card-premium p-6 rounded-xl border border-gray-200">
              <h3 className="font-serif text-2xl font-semibold text-[#262d3d] mb-2">
                R1 — Análise Inicial (30–45 min)
              </h3>
              <p className="text-gray-700">
                Conversa para entender objetivos, momento de vida, perfil de risco e fotografia atual da carteira.
              </p>
              <ul className="mt-4 space-y-2 text-gray-700 text-base">
                <li>• Objetivos e metas financeiras</li>
                <li>• Perfil do investidor e preferências</li>
                <li>• Situação atual da carteira e custos</li>
              </ul>
            </div>
            <div className="card-premium p-6 rounded-xl border border-gray-200">
              <h3 className="font-serif text-2xl font-semibold text-[#262d3d] mb-2">
                R2 — Estudo Personalizado (até 7 dias)
              </h3>
              <p className="text-gray-700">
                Apresentamos um plano sob medida com recomendações e próximos passos.
              </p>
              <ul className="mt-4 space-y-2 text-gray-700 text-base">
                <li>• Alocação sugerida (Brasil e exterior)</li>
                <li>• Oportunidades de eficiência de custos e tributos</li>
                <li>• Rotina de rebalanceamento e acompanhamento</li>
              </ul>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-10">
            Seus dados são protegidos conforme nossa Política de Privacidade. Atendimento consultivo e independente.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
