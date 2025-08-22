// File: app/(userDashboard)/layout.tsx

"use client";

import UserDashboardLayout from "@/components/layout/UserDashboardLayout";
import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";
import { useSession } from "next-auth/react";
import { Toaster } from "sonner";
import React, { useEffect } from "react"; // Import useEffect

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { status } = useSession();

  if (status === "authenticated") {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }

  return (
    <>
      <UserDashboardLayout>{children}</UserDashboardLayout>
      <Toaster richColors />
    </>
  );
}

/**
 * A component to contain the logic that should only run
 * when a user is authenticated.
 */
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession(); // Get the full session data here
  useOnlineUserLeaderBoard();

  // --- START OF NEW CODE ---
  // This hook will register the service worker for push notifications
  // only when the user is logged in.
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && session?.user?.id) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(function(registration) {
          console.log('Service Worker registered with scope:', registration.scope);
        }).catch(function(error) {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, [session]); // This effect runs when the session becomes available
  // --- END OF NEW CODE ---

  return (
    <>
      <UserDashboardLayout>{children}</UserDashboardLayout>
      <Toaster richColors />
    </>
  );
}
 