import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../../database/supabase-types'

let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    supabaseAdminInstance = createClient<Database>(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
      }
    })
  }
  return supabaseAdminInstance
}

type SupabaseAdminClient = ReturnType<typeof createClient<Database>>

// Backward compatibility: lazy-loaded proxy
export const supabaseAdmin = new Proxy({} as SupabaseAdminClient, {
  get: (_target, prop) => {
    return getSupabaseAdmin()[prop as keyof SupabaseAdminClient]
  }
})
