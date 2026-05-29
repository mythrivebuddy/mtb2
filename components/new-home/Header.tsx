"use client";

import { MtbCrossIcon, MtbMenuIcon } from "@/icons/mtb-icons";
import { theme } from "@/lib/new-home/theme/theme";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const Header = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const linkClass = (path: string) =>
    `transition-colors hover:text-[#2C251F] ${
      pathname.startsWith(path) ? "text-[#432E1D]" : "text-[#656565]"
    }`;

  return (
    <header className={` sticky top-0 z-50   w-full ${theme.bgPrimary}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 py-1 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-2">
          <img
            src="/new-home-assets/new-logo.png"
            className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] lg:w-[68px] lg:h-[68.5px]"
          />
          <span
            className={
              theme.typography.brandNavbarHeading + " hidden sm:inline-block "
            }
          >
            My<span className={theme.highLightTextColor}>Thrive</span>Buddy
          </span>
        </div>

        {/* CENTER */}
        <nav className="hidden x1260:flex flex-shrink-0 items-center gap-6 xl:gap-10  text-[16px] font-light">
          <Link href="/features" className={linkClass("/features")}>
            Features
          </Link>
          <Link href="/process" className={linkClass("/process")}>
            The Process
          </Link>
          <Link href="/stories" className={linkClass("/stories")}>
            Success Stories
          </Link>
          <Link href="/helps" className={linkClass("/helps")}>
            Who It Helps
          </Link>
        </nav>

        {/* RIGHT */}
        <div className="hidden x1260:flex items-center gap-3">
          <button className="px-6 py-2.5 rounded-full border border-[#432E1D] text-[#432E1D] text-[15px] font-medium hover:bg-[#432E1D] hover:text-white transition-all">
            Sign In
          </button>
          <button
            className={`px-6 py-2.5 rounded-full text-[15px] font-medium ${theme.buttonDark}`}
          >
            Join Now
          </button>
        </div>
        {/* Mobile Menu Button */}
        <button
          className="flex x1260:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <MtbCrossIcon /> : <MtbMenuIcon />}
        </button>
        {isMenuOpen && (
          <div
            className={`${theme.bgTertiary} absolute top-full left-0 right-0 mt-0 px-4 sm:px-6 md:px-12 py-4 rounded-lg shadow-lg x1260:hidden z-50`}
          >
            <div className="flex flex-col space-y-4">
              <Link href="/features" className={linkClass("/features")}>
                Features
              </Link>
              <Link href="/process" className={linkClass("/process")}>
                The Process
              </Link>
              <Link href="/stories" className={linkClass("/stories")}>
                Success Stories
              </Link>
              <Link href="/helps" className={linkClass("/helps")}>
                Who It Helps
              </Link>
              <div className="flex flex-col gap-2 mt-4">
                <button className="px-6 py-2.5 rounded-full border border-[#432E1D] text-[#432E1D] text-[15px] font-medium hover:bg-[#432E1D] hover:text-white transition-all">
                  Sign In
                </button>
                <button
                  className={`px-6 py-2.5 rounded-full text-[15px] font-medium ${theme.buttonDark}`}
                >
                  Join Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
