export interface Pillar {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
}

export const fundamentalPillars: Pillar[] = [
  {
    id: "portfolio-construction",
    title: "Construção de portfólio e seleção de ativos",
    description: "Selecionamos cuidadosamente os melhores ativos para compor uma carteira diversificada e alinhada aos seus objetivos.",
    icon: "Building"
  },
  {
    id: "systematic-rebalancing", 
    title: "Rebalanceamento sistemático",
    description: "Mantemos sua carteira sempre equilibrada através de ajustes periódicos e estratégicos conforme as condições do mercado.",
    icon: "Scale"
  },
  {
    id: "personalized-planning",
    title: "Planejamento personalizado", 
    description: "Cada cliente tem necessidades únicas. Desenvolvemos estratégias sob medida para seus objetivos específicos.",
    icon: "Target"
  },
  {
    id: "behavioral-coaching",
    title: "Coaching comportamental",
    description: "Ajudamos você a manter a disciplina e tomar decisões racionais, evitando armadilhas emocionais dos investimentos.",
    icon: "Brain"
  },
  {
    id: "cost-management", 
    title: "Gerenciamento de custos",
    description: "Otimizamos todos os custos envolvidos nos seus investimentos, incluindo o cashback de comissões para sua conta.",
    icon: "Calculator"
  },
  {
    id: "intelligent-tax-planning",
    title: "Planejamento tributário inteligente",
    description: "Estruturamos suas aplicações de forma a minimizar a carga tributária e maximizar a eficiência fiscal.",
    icon: "Receipt"
  }
];
