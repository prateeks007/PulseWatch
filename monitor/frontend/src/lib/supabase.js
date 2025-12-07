// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create Supabase client
// This client handles all authentication and API calls to Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Store session in localStorage (persists across browser sessions)
    storage: window.localStorage,
    // Automatically refresh tokens when they expire
    autoRefreshToken: true,
    // Persist session across browser tabs
    persistSession: true,
    // Detect session changes (login/logout) across tabs
    detectSessionInUrl: true
  }
})

// Export auth methods for easy access
export const auth = supabase.auth