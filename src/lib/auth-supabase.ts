import { createSupabaseServerClient, createSupabaseBrowserClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export interface User {
  id: string
  email: string
  name?: string
  role: string
}

// Servidor - verificar se usuário está autenticado
export async function getUser(): Promise<User | null> {
  const supabase = createSupabaseServerClient()
  
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
}

// Servidor - verificar se usuário é admin
export async function requireAuth() {
  const user = await getUser()
  
  if (!user) {
    redirect('/admin/login')
  }

  if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
    redirect('/admin/login')
  }

  return user
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
}
