import { createClient } from '@supabase/supabase-js'

// Fall back to safe placeholder values so createClient doesn't throw.
// All actual network calls are guarded by SUPABASE_CONFIGURED in auth.jsx.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
