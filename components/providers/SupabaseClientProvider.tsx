// components/providers/SupabaseClientProvider.tsx

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

// Create a context for the Supabase client
type SupabaseContextType = SupabaseClient | null;
const SupabaseContext = createContext<SupabaseContextType>(null);

// Create the provider component
export function SupabaseClientProvider({ children }: { children: React.ReactNode }) {
  // Create the client instance ONCE
  const [supabase] = useState(() => createClientComponentClient());
  const { data: nextAuthSession } = useSession(); // Get the NextAuth session

  useEffect(() => {
    // This effect runs whenever the auth session changes
    // Line 22
const supabaseToken = (nextAuthSession as { supabaseAccessToken?: string } | null)?.supabaseAccessToken;

    if (supabaseToken) {
      // If we have a token, set the client's session
      supabase.auth.setSession({
        access_token: supabaseToken,
        refresh_token: '',
      });
    } else {
      // If the session is gone (user logged out), sign out the client
      supabase.auth.signOut();
    }
  }, [nextAuthSession, supabase]); // Re-run when session changes

  // Provide the single client instance to the whole app
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Create a custom hook to easily use the client in other components
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseClientProvider");
  }
  return context;
};