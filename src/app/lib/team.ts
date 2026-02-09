/**
 * Dados e tipagem da equipe LDC Capital
 */

/**
 * Representa um membro da equipe LDC Capital
 */
export interface TeamMember {
  /** Identificador único do membro */
  id: string;

  /** Nome completo do consultor */
  name: string;

  /** Cargo na empresa */
  role: string;

  /** Certificações profissionais (ex: CFP®, CEA, CNPI) */
  certifications?: string[];

  /** Caminho da foto em /public/images/equipe/ */
  photo: string;

  /** Descrição/bio breve do consultor */
  description?: string;

  /** Links de redes sociais */
  social?: {
    linkedin?: string;
    instagram?: string;
  };

  /** Ordem de exibição no grid (menor = primeiro) */
  order: number;
}

/**
 * Dados dos membros da equipe
 * TODO: Atualizar descrições e redes sociais com dados reais
 */
export const teamMembers: TeamMember[] = [
  {
    id: "luciano-herzog",
    name: "Luciano Herzog",
    role: "Sócio Fundador e Diretor",
    certifications: ["CFP®"],
    photo: "/images/equipe/Luciano1.jpg.jpeg",
    description:
      "Fundador da LDC Capital com mais de 15 anos de experiência em consultoria financeira independente. Especialista em planejamento patrimonial e investimentos internacionais.",
    social: {
      linkedin: "https://linkedin.com/in/lucianoherzog",
      instagram: "https://instagram.com/luciano.herzog",
    },
    order: 1,
  },
  {
    id: "germano",
    name: "Germano Laube",
    role: "Co-Fundador e Consultor de Investimentos",
    certifications: ["CEA", "SUSEP"],
    photo: "/images/equipe/Germano1.jpg.jpeg",
    description:
      "Profissional do mercado financeiro desde 2018. Ex-sócio de escritório de assessoria de investimentos, já atuou como gestor de mesa de renda variável, líder comercial e especialista de previdência. Especialização em Finanças internacionais e Política Macroeconômica pela FGV e Pós-graduado em Finanças corporativas, M&A e Equity pela PUCRS.",
    social: {
      linkedin: "#",
    },
    order: 2,
  },
  {
    id: "jean",
    name: "Jean Wally da Silva",
    role: "Consultor de Investimentos",
    certifications: ["CEA"],
    photo: "/images/equipe/Jean1.jpg.jpeg",
    description:
      "Economista e especialista em investimentos pela ANBIMA. Possui mais de 6 anos de experiência no atendimento a clientes de alta renda e empresas. Atualmente, em formação como planejador financeiro. Empreendedor por natureza, iniciou sua trajetória aos 20 anos. Casado e pai, nas horas vagas gosta de praticar esportes e valorizar o tempo em família.",
    social: {
      linkedin: "#",
    },
    order: 3,
  },
  {
    id: "alexandre",
    name: "Alexandre",
    role: "Corporate Banking & Investment Management",
    certifications: ["CGA"],
    photo: "/images/equipe/Alexandre3.jpg.jpeg",
    description:
      "Trajetória profissional construída em instituição financeira internacional, com foco no segmento Corporate and Investment Banking. Como gestor certificado CGA, foi sócio de gestora Multi Family Office, responsável técnico perante a CVM pela alocação de ativos em fundos de investimentos e carteiras administradas. Formação em Administração de Empresas com ênfase em Comércio Exterior pela UNISINOS.",
    social: {
      linkedin: "#",
    },
    order: 4,
  },
  {
    id: "marcos",
    name: "Marcos Meneghel",
    role: "Co-Fundador e Diretor de Compliance",
    certifications: ["MBA"],
    photo: "/images/equipe/Marcos3 (1).jpg.jpeg",
    description:
      "Estudante de graduação de Economia pela Unisinos, com MBA de Especialista em Investimentos. Durante a estruturação da LDC, desenvolveu habilidades em marketing digital, sendo responsável pela mídia da empresa. Apaixonado pelo mercado financeiro desde cedo, também é aficionado pela prática de esportes e gastronomia.",
    social: {
      linkedin: "#",
    },
    order: 5,
  },
  {
    id: "nathalia",
    name: "Nathália Lopes da Silva",
    role: "BackOffice",
    certifications: [],
    photo: "/images/equipe/Nathalia1.jpg.jpeg",
    description:
      "Técnica em Administração e graduanda em Administração pela Feevale, atua na LDC Capital como Backoffice. Comprometida com organização, responsabilidade e aprendizado contínuo, concilia a vida profissional e acadêmica com a maternidade.",
    social: {
      linkedin: "#",
    },
    order: 6,
  },
];

/**
 * Retorna os membros da equipe ordenados por ordem de exibição
 */
export function getTeamMembers(): TeamMember[] {
  return [...teamMembers].sort((a, b) => a.order - b.order);
}

/**
 * Busca um membro específico por ID
 */
export function getTeamMemberById(id: string): TeamMember | undefined {
  return teamMembers.find((member) => member.id === id);
}

/**
 * Formata certificações para exibição
 * Ex: ["CFP®", "CEA"] → "CFP®, CEA"
 */
export function formatCertifications(certs?: string[]): string {
  if (!certs || certs.length === 0) return "";
  return certs.join(", ");
}
