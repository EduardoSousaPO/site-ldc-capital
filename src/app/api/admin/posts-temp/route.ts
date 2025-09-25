import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import readingTime from "reading-time";

// API TEMPORÁRIA para criar posts sem autenticação
// REMOVER APÓS CONFIGURAR ENVIRONMENT VARIABLES NA VERCEL

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Creating post via temporary API...');
    
    const body = await request.json();
    console.log('📋 Request body received');
    
    const { title, content, summary, category, cover, published } = body;

    if (!title || !content) {
      console.log('❌ Missing required fields:', { title: !!title, content: !!content });
      return NextResponse.json({ 
        error: "Missing required fields", 
        details: { title: !!title, content: !!content }
      }, { status: 400 });
    }

    // Buscar o usuário admin
    const adminUser = await prisma.user.findFirst({
      where: { 
        role: 'ADMIN',
        email: 'admin@ldccapital.com.br'
      },
      select: { id: true }
    });

    if (!adminUser) {
      return NextResponse.json({ 
        error: "Admin user not found in database" 
      }, { status: 500 });
    }

    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, ''); // Remove hífens do início e fim

    console.log('📝 Generated slug:', slug);

    const stats = readingTime(content);
    console.log('📊 Reading time:', stats.text);

    console.log('💾 Creating post in database...');
    const newPost = await prisma.blogPost.create({
      data: {
        title: title.trim(),
        slug,
        content,
        summary: summary?.trim() || null,
        category: category || 'Geral',
        cover: cover || null,
        published: published || false,
        readingTime: stats.text,
        authorId: adminUser.id,
        publishedAt: published ? new Date() : null,
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('✅ Post created successfully:', newPost.id);
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating post:", error);
    
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
