import { createClient } from '@supabase/supabase-js'

// Só no servidor: ignora as regras de segurança (usado pelos avisos e pelo admin)
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
