// app/layout.tsx
"use client"
import UserDashboardLayout from "@/components/layout/UserDashboardLayout";
import useUserPresence, { UserPresenceProps } from "@/hooks/userUserPresence";
import { useSession } from "next-auth/react";

export default function layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
   const { data: session, status } = useSession();
    const userId = session?.user?.id;
  
    useUserPresence({ userId } as UserPresenceProps);
  return <UserDashboardLayout>{children}</UserDashboardLayout>;
}
