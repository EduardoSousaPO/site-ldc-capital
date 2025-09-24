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

