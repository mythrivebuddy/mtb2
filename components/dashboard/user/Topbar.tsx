// components/TopBar.tsx
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

export default function TopBar() {
  return (
    <header className="h-16 bg-transparent flex items-center justify-between ">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Leader Board</h1>
      </div>

      {/* Search and User Section */}
      <div className="flex items-center gap-10">
        {/* Search Bar */}
        <div className="relative max-w-md w-80">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 focus:outline-none" />
          </div>
          <input
            type="search"
            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Search Anything Here..."
          />
        </div>

        {/* JP Points Badge */}
        <div>
          <Badge
            variant="outline"
            className="py-2 px-3 bg-blue-50 hover:bg-blue-50 border-blue-100"
          >
            <span className="mr-1">🏆</span>
            <span className="font-medium">JP</span>
            <span className="font-bold text-blue-500 ml-1">250</span>
          </Badge>
        </div>

        {/* Notifications */}
        <button className="rounded-full p-2 text-slate-600 hover:bg-slate-100 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Avatar */}
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage src="/avatar.png" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
