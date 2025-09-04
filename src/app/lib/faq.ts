export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const faqItems: FAQItem[] = [
  {
    id: "1",
    question: "Por que devo confiar na LDC Capital?",
    answer: "Somos consultores financeiros independentes devidamente registrados e certificados pelos órgãos reguladores do mercado financeiro do Brasil, como a CVM. Com anos de experiência, competência e paixão pelo mercado, temos total consciência de que somos qualificados para te ajudar a alinhar sua vida financeira, traçar um caminho consistente até os seus objetivos e fazer você dormir tranquilo enquanto seu dinheiro trabalha para você. Tudo isso seguindo os nossos princípios e valores principais: Foco no Cliente, Confiança e Transparência."
  },
  {
    id: "2", 
    question: "Qual é a diferença entre assessoria e consultoria de investimentos?",
    answer: "Um consultor de investimentos atua de forma independente, sem vínculos com corretoras ou bancos, prestando orientação personalizada aos clientes com base em uma análise aprofundada do seu perfil, objetivos e patrimônio, em uma abordagem geral da vida financeira do cliente, de ponta a ponta. Ele é remunerado diretamente pelo cliente e não recebe comissão pela venda de produtos financeiros, o que garante maior imparcialidade. Já o assessor de investimentos está vinculado a uma corretora e auxilia os investidores na escolha e operação de produtos oferecidos por essa instituição, mas não é lhe permitido recomendar investimentos. Sua remuneração vem das comissões sobre os produtos distribuídos. Em resumo, a principal diferença está na relação com os produtos financeiros e a forma de remuneração, o que influencia diretamente o nível de conflitos de interesses."
  },
  {
    id: "3",
    question: "Como eu pago a LDC pelo serviço de consultoria?",
    answer: "O serviço de nossa consultoria segue o modelo Fee-Based. Em palavras mais didáticas, é cobrado um percentual previamente acordado sobre o volume de ativos do cliente que ficará sob nossa custódia. O valor da cobrança varia conforme a faixa do patrimônio do investidor. Somos expressamente proibidos de receber comissão pela recomendação de ativos. Inclusive, essa comissão que seria recebida por um assessor, volta como cashback para a conta do cliente. Com isso, o conflito de interesses em nosso serviço é inexistente."
  },
  {
    id: "4",
    question: "Vocês possuem modo de consultoria online?",
    answer: "Sim, possuímos disponibilidade de atendimento aonde quer que você esteja. Atendemos o Brasil inteiro. Para execuções de reuniões de acompanhamento, chamadas de vídeos virtuais serão feitas, além de possibilidade de contato direto com o consultor para maior suporte com dúvidas e demandas operacionais via e-mail, ligação ou WhatsApp."
  },
  {
    id: "5",
    question: "Preciso sair da minha assessoria atual para ter o serviço da LDC?",
    answer: "Sim, é preciso sair da assessoria atual. Isso ocorre pelo fato de que para termos a visão de seus investimentos, entramos exatamente no lugar ocupado pelo seu assessor, sendo inviável ter simultaneamente dois profissionais cuidando do mesmo patrimônio. Uma vez conosco, assumimos o papel de análise, acompanhamento e execução operacional da sua carteira."
  }
];
