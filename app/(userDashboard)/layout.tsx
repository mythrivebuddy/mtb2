"use client"
import UserDashboardLayout from "@/components/layout/UserDashboardLayout";
import useOnlineUserLeaderBoard from "@/hooks/useOnlineUserLeaderBoard";
import React from "react"; 

export default function Layout({ // Capitalized 'Layout' is common for components, though 'layout' works for file-based layouts.
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ✅ FIXED: Removed 'status' from the destructuring as it was not being used.


  // Pass the object that matches UserPresenceProps.
  // The 'as UserPresenceProps' cast can often be removed if types align,
  // but keeping it here doesn't hurt if it helps TypeScript infer correctly.

  useOnlineUserLeaderBoard()
 
  return <UserDashboardLayout>{children}</UserDashboardLayout>;
}
