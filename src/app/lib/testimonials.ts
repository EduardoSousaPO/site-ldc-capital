export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
  company?: string;
  location?: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "1",
    quote: "A LDC Capital mudou completamente minha visão sobre investimentos. O modelo fee-based elimina qualquer conflito de interesse e me dá total confiança nas recomendações.",
    author: "Maria Silva",
    role: "Empresária",
    location: "São Paulo, SP",
  },
  {
    id: "2", 
    quote: "Finalmente encontrei uma consultoria que entende minhas necessidades. O atendimento personalizado e a transparência total fazem toda a diferença.",
    author: "João Santos",
    role: "Médico",
    location: "Belo Horizonte, MG",
  },
  {
    id: "3",
    quote: "O planejamento tributário inteligente da LDC me fez economizar significativamente em impostos. Recomendo para qualquer pessoa séria sobre investimentos.",
    author: "Ana Costa",
    role: "Advogada", 
    location: "Rio de Janeiro, RJ",
  },
  {
    id: "4",
    quote: "A metodologia em 5 passos é muito clara e eficiente. Em 7 dias tinha um plano completo e personalizado para meus objetivos.",
    author: "Carlos Oliveira",
    role: "Engenheiro",
    location: "Florianópolis, SC",
  },
  {
    id: "5",
    quote: "O diferencial está no acompanhamento mensal e no rebalanceamento sistemático. Meu patrimônio nunca esteve tão bem estruturado.",
    author: "Patricia Lima",
    role: "Arquiteta",
    location: "Porto Alegre, RS",
  },
];
