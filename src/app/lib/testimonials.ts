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
    quote: "A LDC Capital presta um serviço de consultoria de investimentos diferenciado, voltado para o crescimento patrimonial do seu cliente e sem conflito de interesses. O seu CEO, Luciano Herzog, é extremamente competente e está sempre atualizado em relação às diversas modalidades de investimentos. Parabéns!",
    author: "Renato Vieira Oliveira",
  },
  {
    id: "2", 
    quote: "Tenho tido contato continuado e muito positivo com a equipe da LDC Capital, sempre com o objetivo de entender os impactos do mercado nas minhas finanças, as tendências que mereçem atenção e atuação de minha parte, as oportunidades disponíveis e os riscos que devem ser gerenciados. Sigo satisfeito com os resultados.",
    author: "Ricardo Loureiro",
  },
  {
    id: "3",
    quote: "Relacionamento excelente e focado. Estabelecidos os objetivos e estratégias, estas são perseguidas tempestivamente de forma profissional e isenta. Com esta abordagem obtivemos um resultado ímpar. Excepcional mesmo, impossível de ser alcançado sem a participação da LDC Capital. Gratos pela parceria.",
    author: "Martin Bromberg",
    location: "Porto Alegre - RS",
  },
  {
    id: "4",
    quote: "Luciano e a equipe da LDC são muito profissionais. Estão sempre atualizados com o que está acontecendo, e desde que comecei a trabalhar com eles comecei a ver diferença no crescimento do patrimônio. É uma empresa que recomendo e indico!",
    author: "William Allan Rossi",
  },
  {
    id: "5",
    quote: "A melhor escolha que fiz neste último ano foi a de colocar meus investimentos aos cuidados de vocês.",
    author: "Sandra Benko",
  },
  {
    id: "6",
    quote: "Equipe super profissional! Consultoria wealth excelente que me proporciona flexibilidade, segurança e tranquilidade.",
    author: "Juliano Valentini",
    location: "Taquara - RS",
  },
  {
    id: "7",
    quote: "Luciano Herzog e sua equipe são gestores excepcionais e pessoas verdadeiramente diferenciadas. Eu e minha família estamos muito satisfeitos com o serviço prestado e com os resultados alcançados. A atuação deles nos trouxe muita tranquilidade, segurança e total transparência. Somos muito gratos pelo excelente trabalho!",
    author: "Ramon Coral Ghanem",
    location: "Joinville - SC",
  },
  {
    id: "8",
    quote: "Consultores bastante profissionais, com grande conhecimento do mercado financeiro tanto no Brasil como no Exterior, bastante atenciosos com os clientes e sem conflito de interesses em suas indicações de investimentos. Nota 10!",
    author: "Eduardo Lara",
  },
  {
    id: "9",
    quote: "Alto conhecimento de mercado, com sólidas indicações de investimento.",
    author: "Oxigênio Jundiaí",
    location: "Jundiaí - SP",
  },
  {
    id: "10",
    quote: "Equipe altamente especializada em consultoria financeira, sempre priorizando o melhor para o cliente, sem conflitos de interesse. Já sou cliente do Luciano há dois anos e obtive resultados muito positivos. Recomendo!",
    author: "Alexandre El Kik",
    location: "Porto Alegre - RS",
  },
  {
    id: "11",
    quote: "Excelente trabalho de consultoria financeira.",
    author: "Fábio Affonso",
    location: "Portugal",
  },
  {
    id: "12",
    quote: "Excelente equipe. Profissionais de altíssimo nível e conhecimento.",
    author: "Marcel Reno",
  },
];
