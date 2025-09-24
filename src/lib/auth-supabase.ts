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