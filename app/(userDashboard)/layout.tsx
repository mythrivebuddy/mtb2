// app/layout.tsx
import Sidebar from "@/components/dashboard/user/Sidebar";
import TopBar from "@/components/dashboard/user/Topbar";



export default function UserDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // <html lang="en">
    //   <body className={inter.className}>
    <div className="flex h-full p-7 overflow-auto">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden pl-6">
        <TopBar />
        <main className="flex-1 overflow-auto bg-transparent">
          {children}
        </main>
      </div>
    </div>
    //   </body>
    // </html>
  );
}
