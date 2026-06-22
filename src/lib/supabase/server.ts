import 'server-only'
import { createClient } from '@supabase/supabase-js'

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    supabaseAdminInstance = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
      }
    })
  }
  return supabaseAdminInstance
}

// Backward compatibility: lazy-loaded proxy
export const supabaseAdmin = new Proxy({} as any, {
  get: (target, prop) => {
    return getSupabaseAdmin()[prop as keyof typeof supabaseAdminInstance]
  }
})
