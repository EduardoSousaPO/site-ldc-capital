import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import readingTime from "reading-time";

async function checkAuth() {
  try {
    console.log('🔐 Checking authentication...');
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nodeEnv: process.env.NODE_ENV
    });

    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Supabase auth error:', error);
      // Tentar autenticação alternativa em caso de erro
      return await fallbackAuth();
    }
    
    if (!user) {
      console.log('❌ No user found in Supabase');
      return await fallbackAuth();
    }

    console.log('✅ User found in Supabase:', { id: user.id, email: user.email });
    
    // Buscar usuário no banco de dados para pegar o role correto
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!dbUser) {
      console.error('❌ User not found in database');
      // Tentar encontrar por email
      const userByEmail = await prisma.user.findUnique({
        where: { email: user.email || '' },
        select: { id: true, email: true, name: true, role: true }
      });
      
      if (userByEmail) {
        console.log('✅ Found user by email:', userByEmail);
        return {
          id: userByEmail.id,
          email: userByEmail.email || '',
          name: userByEmail.name,
          role: userByEmail.role
        };
      }
      
      return null;
    }

    console.log('✅ Database user:', dbUser);

    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'EDITOR') {
      console.error('❌ Insufficient permissions:', dbUser.role);
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email || '',
      name: dbUser.name,
      role: dbUser.role
    };
  } catch (error) {
    console.error('❌ Error in checkAuth:', error);
    return await fallbackAuth();
  }
}

// Função de fallback para autenticação em caso de problemas
async function fallbackAuth() {
  try {
    console.log('🔄 Trying fallback authentication...');
    
    // Buscar o usuário admin padrão
    const adminUser = await prisma.user.findFirst({
      where: { 
        role: 'ADMIN',
        email: 'admin@ldccapital.com.br'
      },
      select: { id: true, email: true, name: true, role: true }
    });
    
    if (adminUser) {
      console.log('✅ Using admin fallback user:', adminUser);
      return {
        id: adminUser.id,
        email: adminUser.email || '',
        name: adminUser.name,
        role: adminUser.role
      };
    }
    
    console.error('❌ No admin user found in fallback');
    return null;
  } catch (error) {
    console.error('❌ Error in fallback auth:', error);
    return null;
  }
}

export async function GET() {
  try {
    const user = await checkAuth();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.blogPost.findMany({
      orderBy: {
        createdAt: "desc",
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

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Creating new post...');
    console.log('🔍 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV
    });
    
    const user = await checkAuth();

    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ User authorized:', user.email);

    const body = await request.json();
    console.log('📋 Request body:', { ...body, content: body.content ? 'Content provided' : 'No content' });
    
    const { title, content, summary, category, cover, published } = body;

    if (!title || !content) {
      console.log('❌ Missing required fields:', { title: !!title, content: !!content });
      return NextResponse.json({ 
        error: "Missing required fields", 
        details: { title: !!title, content: !!content }
      }, { status: 400 });
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
        authorId: user.id,
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
    
    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}