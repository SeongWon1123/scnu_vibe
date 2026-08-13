import { createClient, type SupabaseClient } from "@supabase/supabase-js"

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.startsWith("YOUR_")) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function supabaseAnon(): SupabaseClient {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  )
}

// Server-side only. Never import this function from a client component.
export function supabaseService(): SupabaseClient {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  )
}