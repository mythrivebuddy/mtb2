
// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This ensures we have a named export called 'supabaseClient'
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);