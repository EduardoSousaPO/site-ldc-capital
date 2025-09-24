import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { User } from '@/lib/auth-supabase'

// Servidor - verificar se usuário está autenticado
export async function getUser(): Promise<User | null> {
  try {
    const supabase = await createSupabaseServerClient()
    
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
    console.error('Error getting user:', error)
    return null
  }
}
