import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.warn('⚠️  SUPABASE_URL ili SUPABASE_SERVICE_ROLE_KEY nisu podešeni')
}

export const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null

export function isSupabaseConfigured() {
  return Boolean(supabase)
}
