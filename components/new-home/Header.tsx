"use client";

import { cormorant } from "@/lib/new-home/fonts/fonts";
import { theme } from "@/lib/new-home/theme/theme";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `transition-colors hover:text-[#2C251F] ${
      pathname.startsWith(path)
        ? "text-[#432E1D]"
        : "text-[#656565]"
    }`;

  return (
 <header className={` sticky top-0 z-50   w-full ${theme.bgPrimary}` }>
  
  <div className="max-w-[1440px] mx-auto px-6 md:px-12 h-[96px] flex items-center justify-between">

    {/* LEFT */}
    <div className="flex items-center gap-2">
      <img src="/new-home-assets/new-logo.png" className="w-[68px] h-[68.5px]" />
      <span className={`${cormorant.className} text-4xl font-medium text-[#2C251F]`}>
        My<span className={theme.highLightTextColor}>Thrive</span>Buddy
      </span>
    </div>

    {/* CENTER */}
    <nav className="hidden lg:flex items-center gap-12 text-[16px] font-light">
      <Link href="/features" className={linkClass("/features")}>Features</Link>
      <Link href="/process" className={linkClass("/process")}>The Process</Link>
      <Link href="/stories" className={linkClass("/stories")}>Success Stories</Link>
      <Link href="/helps" className={linkClass("/helps")}>Who It Helps</Link>
    </nav>

    {/* RIGHT */}
    <div className="flex items-center gap-3">
      <button className="px-6 py-2.5 rounded-full border border-[#432E1D] text-[#432E1D] text-[15px] font-medium hover:bg-[#432E1D] hover:text-white transition-all">
        Sign In
      </button>
      <button className={`px-6 py-2.5 rounded-full text-[15px] font-medium ${theme.buttonDark}`}>
        Join Now
      </button>
    </div>

  </div>
</header>
  );
};

export default Header;