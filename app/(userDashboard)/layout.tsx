"use client"
import UserDashboardLayout from "@/components/layout/UserDashboardLayout";
import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";
import { useSession } from "next-auth/react"; // Import useSession here
import React from "react"; 

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the session directly in the layout
  const { status } = useSession();

  // Conditionally render a component that uses the hook
  // This prevents the hook from running during the build or when logged out.
  if (status === 'authenticated') {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }

  // For loading or unauthenticated states, render a simpler layout
  // without the user-dependent hook.
  return <UserDashboardLayout>{children}</UserDashboardLayout>;
}


/**
 * A new component to contain the logic that should only run
 * when a user is authenticated.
 */
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  // THE FIX: The hook is now only called inside this component,
  // which is only rendered when the session status is 'authenticated'.
  useOnlineUserLeaderBoard();

  return <UserDashboardLayout>{children}</UserDashboardLayout>;
}
