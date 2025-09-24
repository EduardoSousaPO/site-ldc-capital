import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Criar usuário administrador
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ldccapital.com.br';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'Administrador LDC';

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Usuário administrador criado:', {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role
  });

  // Criar categorias padrão
  const categories = [
    { name: 'Consultoria Financeira', slug: 'consultoria-financeira' },
    { name: 'Investimentos', slug: 'investimentos' },
    { name: 'Planejamento Financeiro', slug: 'planejamento-financeiro' },
    { name: 'Mercado Financeiro', slug: 'mercado-financeiro' },
    { name: 'Educação Financeira', slug: 'educacao-financeira' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log('✅ Categorias criadas');

  // Criar post de exemplo
  const examplePost = await prisma.blogPost.upsert({
    where: { slug: 'bem-vindo-ao-blog-ldc-capital' },
    update: {},
    create: {
      title: 'Bem-vindo ao Blog LDC Capital',
      slug: 'bem-vindo-ao-blog-ldc-capital',
      content: `# Bem-vindo ao Blog LDC Capital

Estamos muito felizes em dar as boas-vindas ao nosso novo blog! Aqui você encontrará conteúdo especializado sobre:

## 📈 Investimentos
- Análises de mercado
- Estratégias de investimento
- Diversificação de carteira

## 💰 Planejamento Financeiro
- Como organizar suas finanças
- Metas financeiras
- Reserva de emergência

## 🎯 Consultoria Financeira
- Nossos serviços
- Cases de sucesso
- Metodologia LDC

## 📚 Educação Financeira
- Conceitos básicos
- Dicas práticas
- Ferramentas úteis

---

**Acompanhe nossos conteúdos e transforme sua relação com o dinheiro!**

*Equipe LDC Capital*`,
      summary: 'Conheça o novo blog da LDC Capital e descubra todo o conteúdo especializado que preparamos para você.',
      category: 'Educação Financeira',
      published: true,
      readingTime: '2 min',
      publishedAt: new Date(),
      authorId: admin.id,
    },
  });

  console.log('✅ Post de exemplo criado:', {
    id: examplePost.id,
    title: examplePost.title,
    slug: examplePost.slug
  });

  // Criar materiais de exemplo
  const exampleMaterials = [
    {
      title: 'Cartilha do Investidor Iniciante',
      slug: 'cartilha-investidor-iniciante',
      description: 'Tudo que você precisa saber para dar os primeiros passos no mundo dos investimentos',
      content: `# Cartilha do Investidor Iniciante

## O que você vai aprender:

### 1. Conceitos Básicos
- O que são investimentos
- Diferença entre poupança e investimento
- Risco x Retorno

### 2. Primeiros Passos
- Como começar a investir
- Documentos necessários
- Escolhendo uma corretora

### 3. Tipos de Investimentos
- Renda Fixa
- Renda Variável
- Fundos de Investimento

### 4. Estratégias
- Diversificação
- Perfil de investidor
- Metas financeiras

---

**Baixe agora e comece sua jornada como investidor!**`,
      category: 'GUIAS',
      type: 'Cartilha',
      pages: 28,
      published: true,
      featured: true
    },
    {
      title: 'Guia de Planejamento Financeiro Pessoal',
      slug: 'guia-planejamento-financeiro-pessoal',
      description: 'Aprenda a organizar suas finanças e criar um planejamento sólido para o futuro',
      content: `# Guia de Planejamento Financeiro Pessoal

## Organize sua vida financeira:

### 1. Diagnóstico Financeiro
- Levantamento de receitas
- Mapeamento de gastos
- Análise de dívidas

### 2. Orçamento Pessoal
- Como criar um orçamento
- Regra 50-30-20
- Controle de gastos

### 3. Reserva de Emergência
- Importância da reserva
- Quanto guardar
- Onde investir

### 4. Metas Financeiras
- Definindo objetivos
- Prazos e valores
- Estratégias de alcance

---

**Transforme sua relação com o dinheiro!**`,
      category: 'Planejamento Financeiro',
      type: 'Guia',
      pages: 35,
      published: true,
      featured: true
    }
  ];

  for (const materialData of exampleMaterials) {
    await prisma.material.upsert({
      where: { slug: materialData.slug },
      update: {},
      create: {
        ...materialData,
        publishedAt: new Date(),
        authorId: admin.id,
      },
    });
  }

  console.log('✅ Materiais de exemplo criados');

  console.log('\n🎉 Seed executado com sucesso!');
  console.log('\n📝 Credenciais de acesso:');
  console.log(`Email: ${adminEmail}`);
  console.log(`Senha: ${adminPassword}`);
  console.log('\n🔗 Acesse: http://localhost:3000/admin/login');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

