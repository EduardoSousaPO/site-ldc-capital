import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Singleton para evitar múltiplas instâncias
let browserClient: ReturnType<typeof createBrowserClient> | null = null
let adminClient: ReturnType<typeof createClient> | null = null

// Cliente para componentes do browser (usa createBrowserClient do @supabase/ssr)
// Isso garante que os cookies sejam salvos corretamente para o servidor ler
export const createSupabaseBrowserClient = () => {
  if (typeof window === 'undefined') {
    // Server-side: sempre criar nova instância sem cookies
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  }

  // Client-side: usar createBrowserClient do @supabase/ssr
  // Isso salva cookies HTTP que o servidor pode ler
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
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

// Cliente para uso em Server Components e API Routes
export const createSupabaseServerClient = (cookieStore: ReturnType<typeof cookies>) => {
  // Extrair o project ref da URL para filtrar cookies corretos
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
  const cookiePrefix = projectRef ? `sb-${projectRef}-` : 'sb-';
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Filtrar apenas cookies do projeto atual
        const allCookies = cookieStore.getAll();
        const filteredCookies = allCookies.filter(cookie => {
          // Se for cookie do Supabase, verificar se é do projeto correto
          if (cookie.name.startsWith('sb-')) {
            return cookie.name.startsWith(cookiePrefix);
          }
          // Manter outros cookies (Next.js, analytics, etc)
          return true;
        });
        
        return filteredCookies;
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Cookie setting can fail in middleware, ignore silently
            if (process.env.NODE_ENV === 'development') {
              console.warn("Erro ao definir cookie:", name, error);
            }
          }
        });
      },
    },
  })
}