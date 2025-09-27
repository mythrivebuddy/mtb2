// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Frontend / browser-safe keys
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
