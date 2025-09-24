import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Verificar se já existe um usuário admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });

    if (existingAdmin) {
      return NextResponse.json({ 
        message: "Admin user already exists",
        email: existingAdmin.email
      });
    }

    // Criar usuário administrador
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ldccapital.com.br';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Administrador LDC';
    
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: 'ADMIN',
      },
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

    // Criar post de exemplo
    const examplePost = await prisma.blogPost.create({
      data: {
        title: 'Bem-vindo ao Blog LDC Capital',
        slug: 'bem-vindo-ao-blog-ldc-capital',
        content: `# Bem-vindo ao Blog LDC Capital!

Este é o seu primeiro post. Edite-o ou exclua-o e comece a criar conteúdo incrível!

## O que você pode esperar?

Aqui no blog da LDC Capital, você encontrará artigos aprofundados sobre:

*   **Investimentos:** Estratégias, análises de mercado e oportunidades.
*   **Planejamento Financeiro:** Dicas para organizar suas finanças e alcançar seus objetivos.
*   **Mercado Financeiro:** Notícias, tendências e insights sobre o cenário econômico.
*   **Educação Financeira:** Conteúdo para você tomar decisões mais inteligentes.

## Comece a explorar!

Navegue pelas categorias, deixe seus comentários e compartilhe o conhecimento. Estamos aqui para te ajudar a ir "Mais do que finanças, direção."

**Equipe LDC Capital**`,
        summary: 'Descubra o que esperar do blog da LDC Capital: insights sobre investimentos, planejamento e mercado financeiro.',
        published: true,
        readingTime: '2 min de leitura',
        publishedAt: new Date(),
        authorId: admin.id,
        categoryId: (await prisma.category.findUnique({ where: { slug: 'educacao-financeira' } }))?.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      credentials: {
        email: adminEmail,
        password: adminPassword
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
