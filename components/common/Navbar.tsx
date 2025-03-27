"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logoImg from "../../public/logo.png";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src={logoImg}
            alt="MyThriveBuddy"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="font-semibold text-lg sm:text-[22px] text-[#1E2875]">
            MyThriveBuddy.com
          </span>
          <span className="text-[10px] sm:text-[12px] font-medium px-1.5 sm:px-2 py-0.5 bg-black text-white rounded">
            BETA
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
          <Link
            href="/blog"
            className="text-[#333333] hover:text-[#1E2875] text-[16px]"
          >
            Blog
          </Link>
          <Link
            href="/contact"
            className="text-[#333333] hover:text-[#1E2875] text-[16px]"
          >
            Contact Us
          </Link>
          <div className="flex items-center space-x-3">
            {!session ? (
              <>
                <Link
                  href="/signup"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#1E2875] text-white rounded-full text-[14px] sm:text-[15px] font-medium hover:bg-[#1E2875]/90 transition-colors"
                >
                  SignUp
                </Link>
                <Link
                  href="/signin"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#0A0B1C] text-white rounded-full text-[14px] sm:text-[15px] font-medium hover:bg-[#0A0B1C]/90 transition-colors"
                >
                  SignIn
                </Link>
              </>
            ) : (
              <div>
                <button
                  type="button"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#1E2875] text-white rounded-full text-[14px] sm:text-[15px] font-medium hover:bg-[#1E2875]/90 transition-colors"
                  onClick={() => {
                    const confirm = window.confirm(
                      "Are you sure want to sign out ?"
                    );
                    if (confirm) {
                      signOut();
                      router.push("/signin");
                    }
                  }}
                >
                  SignOut
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white mt-2 p-4 rounded-lg shadow-lg md:hidden z-50">
          <div className="flex flex-col space-y-4">
            <Link
              href="/blog"
              className="text-[#333333] hover:text-[#1E2875] text-[16px]"
            >
              Blog
            </Link>
            <Link
              href="/contact"
              className="text-[#333333] hover:text-[#1E2875] text-[16px]"
            >
              Contact Us
            </Link>
            <Link
              href="/signup"
              className="w-full text-center px-6 py-2.5 bg-[#1E2875] text-white rounded-full text-[15px] font-medium hover:bg-[#1E2875]/90 transition-colors"
            >
              SignUp
            </Link>
            <Link
              href="/signin"
              className="w-full text-center px-6 py-2.5 bg-[#0A0B1C] text-white rounded-full text-[15px] font-medium hover:bg-[#0A0B1C]/90 transition-colors"
            >
              SignIn
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
