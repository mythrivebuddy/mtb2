"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils/tw";

type NavItemProps = {
  href: string;
  label: string;
  badge?: string | number;
};

const NavItem = ({ href, label, badge }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center hover:text-jp-orange",
          isActive ? "text-jp-orange" : "text-[#6C7894]"
        )}
      >
        <span className="font-normal text-xl">{label}</span>
        {badge && <span className="ml-1 text-jp-orange">({badge})</span>}
      </Link>
    </li>
  );
};

type NavSectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

const NavSection = ({ title, children, className }: NavSectionProps) => (
  <div className={cn("space-y-9", className)}>
    <h4 className="text-blue font-normal text-xl">{title}</h4>
    <nav>
      <ul className="space-y-6">{children}</ul>
    </nav>
  </div>
);

// export default function AdminSideBar() {
//   const router = useRouter();
//   const pathname = usePathname(); // Get current route

//   const sidebarItems = [
//     { label: "Dashboard", route: "/admin/dashboard" },
//     { label: "User Info", route: "/admin/user-info" },
//     { label: "Spotlight Application", route: "/admin/spotlight" },
//     { label: "Post Blog", route: "/admin/create-blog" },
//   ];

//   return (
//     <div className="w-64 bg-black text-white h-screen fixed">
//       <div className="p-4 border-b border-gray-700">
//         <div className="flex items-center space-x-2">
//           <div className="relative w-10 h-10">
//             <Image
//               src="/logo.png"
//               alt="MyThriveBuddy"
//               fill
//               className="object-contain"
//               priority
//             />
//           </div>
//           <span className="text-xl font-semibold">MyThriveBuddy</span>
//           <span className="text-xs bg-black px-2 py-0.5 rounded">BETA</span>
//         </div>
//       </div>

//       <nav className="mt-4">
//         {sidebarItems.map((item) => (
//           <SidebarItem
//             key={item.route}
//             label={item.label}
//             active={pathname === item.route}
//             onClick={() => router.push(item.route)}
//           />
//         ))}

//         <div className="px-4 mt-8">
//           <hr className="border-gray-700" />
//         </div>

//         <SidebarItem label="Logout" onClick={() => signOut()} />
//       </nav>
//     </div>
//   );
// }

// interface SidebarItemProps {
//   label: string;
//   active?: boolean;
//   onClick: () => void;
// }

// function SidebarItem({ label, active = false, onClick }: SidebarItemProps) {
//   return (
//     <button
//       onClick={onClick}
//       className={`w-full flex items-center px-4 py-3 text-left ${
//         active ? "bg-blue-600" : "hover:bg-gray-700"
//       }`}
//     >
//       <span>{label}</span>
//     </button>
//   );
// }

const Sidebar = () => {
  return (
    <aside className="w-64  bg-white shadow-sm rounded-3xl">
      {/* User Profile Section */}
      <div className="flex flex-col pl-5">
        <div className="flex flex-col gap-5 mt-7">
          {/* Menu Section */}
          <NavSection title="Menu">
            <NavItem href="/admin/dashboard" label="Dashboard" />
            <NavItem href="/admin/user-info" label="User Info" />
            <NavItem href="/admin/spotlight" label="Spotlight" />
            <NavItem href="/admin/blog" label="Blogs" />
            <NavItem href="/admin/email-templates" label="Email Templates" />
            <NavItem href="/admin/prosperity" label="Prosperity" />
            <NavItem href="/admin/faq" label="Faqs" />
            <NavItem href="/admin/activity/update-jp" label="Manage Jp" />
            <NavItem href="/admin/manage-store-product" label="Store" />


          </NavSection>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
