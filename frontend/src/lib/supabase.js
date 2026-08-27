import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

export function getAdminSession() {
  return supabase.auth.getSession()
}

export function signInAdmin(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOutAdmin() {
  return supabase.auth.signOut()
}
