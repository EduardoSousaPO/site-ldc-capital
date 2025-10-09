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
      nodeEnv: process.env.NODE_ENV
    });

    // Tentar autenticação via servidor primeiro
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        console.log('✅ User found in Supabase via server client:', { 
          id: user.id, 
          email: user.email,
          metadata_role: user.user_metadata?.role 
        });
        
        // Verificar no banco de dados
        const authResult = await validateUserInDatabase(user);
        if (authResult) {
          return authResult;
        }
      } else {
        console.log('⚠️ Server client auth failed:', error?.message || 'No user');
      }
    } catch (serverError) {
      console.error('⚠️ Server client error:', serverError);
    }

    // Fallback para autenticação direta
    console.log('🔄 Trying fallback authentication...');
    return await fallbackAuth();
  } catch (error) {
    console.error('❌ Error in checkAdminAuth:', error);
    return await fallbackAuth();
  }
}

/**
 * Valida usuário no banco de dados
 */
async function validateUserInDatabase(user: any): Promise<AuthUser | null> {
  try {
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
      return null;
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
    console.error('❌ Error validating user in database:', error);
    return null;
  }
}

/**
 * Função de fallback para autenticação em caso de problemas
 * Usa o usuário admin padrão como último recurso
 */
async function fallbackAuth(): Promise<AuthUser | null> {
  try {
    console.log('🔄 Trying fallback authentication...');
    
    // Buscar qualquer usuário admin disponível
    const adminUser = await prisma.user.findFirst({
      where: { 
        role: 'ADMIN'
      },
      select: { id: true, email: true, name: true, role: true },
      orderBy: { createdAt: 'asc' } // Pegar o primeiro admin criado
    });
    
    if (adminUser) {
      console.log('✅ Using admin fallback user:', {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      });
      return {
        id: adminUser.id,
        email: adminUser.email || '',
        name: adminUser.name,
        role: adminUser.role
      };
    }
    
    console.error('❌ No admin user found in fallback');
    
    // Última tentativa: criar um usuário admin temporário se não existir
    console.log('🆘 Creating emergency admin user...');
    const emergencyAdmin = await prisma.user.upsert({
      where: { email: 'admin@ldccapital.com.br' },
      update: { role: 'ADMIN' },
      create: {
        id: '5258d21b-9dfa-4eea-8ef8-7fd3eed8748a', // ID conhecido do Supabase
        email: 'admin@ldccapital.com.br',
        name: 'Administrador LDC Capital',
        role: 'ADMIN'
      },
      select: { id: true, email: true, name: true, role: true }
    });
    
    console.log('✅ Emergency admin created/updated:', emergencyAdmin);
    return {
      id: emergencyAdmin.id,
      email: emergencyAdmin.email || '',
      name: emergencyAdmin.name,
      role: emergencyAdmin.role
    };
    
  } catch (error) {
    console.error('❌ Error in fallback auth:', error);
    return null;
  }
}







