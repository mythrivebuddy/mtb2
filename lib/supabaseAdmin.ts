// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

// Server-side only: privileged key
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
