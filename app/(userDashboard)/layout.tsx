// app/layout.tsx
import UserDashboardLayout from "@/components/layout/UserDashboardLayout";

export default function layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <UserDashboardLayout>{children}</UserDashboardLayout>;
}
