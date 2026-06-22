import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.warn('⚠️  SUPABASE_URL ili SUPABASE_SERVICE_ROLE_KEY nisu podešeni')
}

const clientOptions = {
  auth: { persistSession: false },
  realtime: { transport: ws },
}

export const supabase = url && key ? createClient(url, key, clientOptions) : null

export function isSupabaseConfigured() {
  return Boolean(supabase)
}
