import { createSupabaseBrowserClient } from '@/lib/supabase'

export interface User {
  id: string
  email: string
  name?: string
  role: string
}

// Cliente - fazer login
export async function signIn(email: string, password: string) {
  const supabase = createSupabaseBrowserClient()
  
  // Limpar cookies antigos de outros projetos antes de fazer login
  if (typeof window !== 'undefined') {
    // Extrair project ref da URL do Supabase (hardcoded para o projeto atual)
    const projectRef = 'xvbpqlojxwbvqizmixrr';
    const correctPrefix = `sb-${projectRef}-`;
    
    const allCookies = document.cookie.split(';').map(c => c.trim());
    allCookies.forEach(cookie => {
      const [name] = cookie.split('=');
      // Remover cookies do Supabase de outros projetos
      if (name.startsWith('sb-') && !name.startsWith(correctPrefix)) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
        console.log(`🧹 Removido cookie antigo: ${name}`);
      }
    });
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

// Cliente - fazer logout
export async function signOut() {
  const supabase = createSupabaseBrowserClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (!error) {
    window.location.href = '/admin/login'
  }

  return { error }
}

// Cliente - verificar usuário atual
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createSupabaseBrowserClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name,
      role: user.user_metadata?.role || 'USER'
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}