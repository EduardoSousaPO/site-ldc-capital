export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  features: string[];
}

export const services: Service[] = [
  {
    id: "financial-planning",
    title: "Financial Planning",
    description: "Fazemos um estudo para dar direção ao cliente de quando e como conseguirá atingir seus objetivos. Aqui é a base para seus investimentos.",
    icon: "Target",
    features: [
      "Análise detalhada do perfil de risco",
      "Definição de objetivos de curto, médio e longo prazo", 
      "Estratégia personalizada de acumulação",
      "Base sólida para todos os investimentos"
    ]
  },
  {
    id: "investment-consulting", 
    title: "Consultoria de Investimentos",
    description: "Analisamos sua carteira de investimentos, seu perfil e objetivos para traçarmos a melhor estratégia de investimentos para você.",
    icon: "TrendingUp",
    features: [
      "Análise completa da carteira atual",
      "Estratégia personalizada por perfil",
      "Recomendações alinhadas aos objetivos",
      "Otimização de rentabilidade"
    ]
  },
  {
    id: "periodic-monitoring",
    title: "Acompanhamento Periódico", 
    description: "Ficamos próximos do cliente através do envio de relatórios, últimas notícias do mercado e reuniões periódicas, sempre prezando transparência.",
    icon: "Calendar",
    features: [
      "Relatórios periódicos detalhados",
      "Notícias relevantes do mercado",
      "Reuniões regulares de acompanhamento",
      "Transparência total no processo"
    ]
  },
  {
    id: "risk-management",
    title: "Gestão de Riscos", 
    description: "Mais importante do que ganhar muito, é não perder nada! Buscamos eliminar qualquer tipo de desconforto que os investimentos possam causar.",
    icon: "Shield",
    features: [
      "Foco na preservação do capital",
      "Eliminação de desconfortos",
      "Estratégias de proteção",
      "Análise contínua de riscos"
    ]
  },
  {
    id: "offshore-investments",
    title: "Investimentos Offshore",
    description: "Diversificação é chave para proteger seu patrimônio! Buscamos minimizar riscos e aumentar rentabilidade através de investimentos no exterior.",
    icon: "Globe",
    features: [
      "Diversificação internacional",
      "Proteção patrimonial",
      "Minimização de riscos geográficos",
      "Otimização de rentabilidade global"
    ]
  },
  {
    id: "succession-planning",
    title: "Planejamento Sucessório",
    description: "Nos preocupamos não só com o seu dinheiro, como também o legado que você deixará para as próximas gerações, de uma forma que seja mais leve, rápida e menos custosa.",
    icon: "Users",
    features: [
      "Planejamento de legado familiar",
      "Otimização tributária sucessória",
      "Estruturas eficientes de transmissão",
      "Redução de custos e tempo"
    ]
  }
];
