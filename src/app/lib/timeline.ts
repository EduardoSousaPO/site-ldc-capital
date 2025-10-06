export interface TimelineStep {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  duration?: string;
}

export const consultingTimeline: TimelineStep[] = [
  {
    id: "1",
    title: "Conhecendo Você",
    description: "Coleta detalhada de objetivos, horizonte de investimento e tolerância ao risco para entender completamente seu perfil.",
    icon: "Users",
    duration: "1ª reunião"
  },
  {
    id: "2", 
    title: "Estudo e Análise",
    description: "Nossa equipe desenvolve um plano personalizado adequado às suas necessidades específicas e objetivos financeiros.",
    icon: "Search",
    duration: "Até 7 dias"
  },
  {
    id: "3",
    title: "Apresentação do Plano",
    description: "Explicação detalhada da estratégia proposta, carteira sugerida e possíveis ajustes conforme seu feedback.",
    icon: "Presentation",
    duration: "2ª reunião"
  },
  {
    id: "4",
    title: "Implementação",
    description: "Execução das movimentações iniciais e estruturação completa da nova carteira de investimentos.",
    icon: "Play",
    duration: "Após assinatura do contrato"
  },
  {
    id: "5",
    title: "Acompanhamento",
    description: "Manutenção ativa da estratégia com reuniões mensais, rebalanceamentos e ajustes conforme necessário.",
    icon: "BarChart3",
    duration: "Mensal"
  }
];
