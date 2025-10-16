import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnvValue } from './env';

const supabaseUrl = getEnvValue('SUPABASE_URL');
const supabaseAnonKey = getEnvValue('SUPABASE_ANON_KEY');

let supabase: SupabaseClient | null = null;
let supabaseInitializationError: string | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  supabaseInitializationError = "Supabase URL and anonymous key are not configured. Please go to the 'Secrets' tab (key icon 🔑) and set SUPABASE_URL and SUPABASE_ANON_KEY. You can find these in your Supabase project's API settings.";
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    if (error instanceof Error) {
      supabaseInitializationError = `Failed to initialize Supabase client: ${error.message}`;
    } else {
      supabaseInitializationError = 'An unknown error occurred during Supabase client initialization.';
    }
  }
}

export { supabase, supabaseInitializationError };