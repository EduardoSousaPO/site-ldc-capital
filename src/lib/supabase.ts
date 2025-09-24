import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Singleton para evitar múltiplas instâncias
let browserClient: ReturnType<typeof createClient> | null = null
let adminClient: ReturnType<typeof createClient> | null = null

// Cliente básico para uso geral (deprecated - use createSupabaseBrowserClient)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para componentes do browser (singleton)
export const createSupabaseBrowserClient = () => {
  if (typeof window === 'undefined') {
    // Server-side: sempre criar nova instância
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  }

  // Client-side: usar singleton
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce'
      }
    })
  }
  
  return browserClient
}

// Cliente admin (service role) para operações administrativas (singleton)
export const createSupabaseAdminClient = () => {
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  
  return adminClient
}