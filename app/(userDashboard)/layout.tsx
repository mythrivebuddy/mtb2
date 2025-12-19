// File: app/(userDashboard)/layout.tsx

"use client";

import UserDashboardLayout from "@/components/layout/UserDashboardLayout";
import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";
import { useSession } from "next-auth/react";
import { Toaster } from "sonner";
import React, { useEffect } from "react"; // Import useEffect
import { Session } from "next-auth";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { status} = useSession();

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
function AuthenticatedLayout({ children}: { children: React.ReactNode }) {
  useOnlineUserLeaderBoard();

  return (
    <>
      <UserDashboardLayout>{children}</UserDashboardLayout>
      <Toaster richColors />
    </>
  );
}
 