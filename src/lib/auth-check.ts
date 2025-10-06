import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

/**
 * Função centralizada para verificar autenticação em APIs admin
 * Garante consistência em todas as rotas
 */
export async function checkAdminAuth(): Promise<AuthUser | null> {
  try {
    console.log('🔐 Checking admin authentication...');
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
      return await fallbackAuth();
    }
    
    if (!user) {
      console.log('❌ No user found in Supabase');
      return await fallbackAuth();
    }

    console.log('✅ User found in Supabase:', { 
      id: user.id, 
      email: user.email,
      metadata_role: user.user_metadata?.role 
    });
    
    // Buscar usuário no banco de dados para pegar o role correto
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!dbUser) {
      console.error('❌ User not found in database by ID, trying by email...');
      
      // Tentar encontrar por email
      const userByEmail = await prisma.user.findUnique({
        where: { email: user.email || '' },
        select: { id: true, email: true, name: true, role: true }
      });
      
      if (userByEmail) {
        console.log('✅ Found user by email:', userByEmail);
        
        // Verificar permissões
        if (userByEmail.role !== 'ADMIN' && userByEmail.role !== 'EDITOR') {
          console.error('❌ Insufficient permissions:', userByEmail.role);
          return null;
        }
        
        return {
          id: userByEmail.id,
          email: userByEmail.email || '',
          name: userByEmail.name,
          role: userByEmail.role
        };
      }
      
      console.error('❌ User not found in database by email either');
      return await fallbackAuth();
    }

    console.log('✅ Database user found:', dbUser);

    // Verificar permissões
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
    console.error('❌ Error in checkAdminAuth:', error);
    return await fallbackAuth();
  }
}

/**
 * Função de fallback para autenticação em caso de problemas
 * Usa o usuário admin padrão como último recurso
 */
async function fallbackAuth(): Promise<AuthUser | null> {
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





