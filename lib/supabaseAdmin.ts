// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

// Ensure env variables are loaded (this should be the case in Next.js)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase URL or Service Role Key in .env.local");
}

// Create a single admin client to be used server-side
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);