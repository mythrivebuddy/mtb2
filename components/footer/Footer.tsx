"use client";
import assets from "@/lib/constants/assets";
import { theme } from "@/lib/new-home/theme/theme";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const session = useSession();
    const pathname = usePathname();

const isDashboard = pathname.includes("dashboard");
  return (
    <footer className="mt-6">
      <div className="py-4">
        {/* TOP GRID */}
        <div className="grid lg:grid-cols-4 gap-16">
          {/* Logo + description */}
          <div>
           <Link
              href="/?from=user-consent"
              className="flex items-center gap-3"
            >
              <Image
                src={assets.logo.current}
                height={68}
                width={68}
                alt="Logo"
                className="h-[40px] w-[40px] md:h-[50px] md:w-[50px] x1260:w-[68px] x1260:h-[68.5px]"
              />
              <span className={` ${isDashboard && session.status === "authenticated" ? theme.typography.brandDashboardFooterHeading : theme.typography.brandFooterHeading}`}>
                My<span className={theme.highLightTextColor}>Thrive</span>Buddy
              </span>
            </Link>

            <p className="mt-4 text-md text-slate-600 dark:text-slate-400">
        Your Personal & Professional Growth Environment
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:col-span-3 gap-8">
            <div>
              <h3 className="font-semibold dark:text-white">Product</h3>
              <ul className="mt-4 space-y-3">
                {[
                  { label: "Benefits", link: "/why-mythrivebuddy" },
                  { label: "Pricing", link: "/pricing" },
                  { label: "Challenges", link: "/dashboard/challenge" },
                  { label: "Future Vision", link: "/future-vision-of-mythrivebuddy" },
                ].map((i) => (
                  <li key={i.label}>
                    <Link
                      className="text-sm hover:text-brand text-slate-600 dark:text-slate-400"
                      href={i.link}
                    >
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold dark:text-white">Learn</h3>
              <ul className="mt-4 space-y-3">
                {[
                  { label: "Blog", link: "/blog" },
                  { label: "Webinars", link: "/live-webinars" },
                  { label: "FAQs", link: "/faqs" },
                  { label: "About", link: "/about-us" },
                ].map((i) => (
                  <li key={i.label}>
                    <Link
                      className="text-sm hover:text-brand text-slate-600 dark:text-slate-400"
                      href={i.link}
                    >
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold dark:text-white">Company</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    className="text-sm hover:text-brand text-slate-600 dark:text-slate-400"
                    href={`/contact`}
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-sm hover:text-brand text-slate-600 dark:text-slate-400"
                    href="/privacy-policy"
                  >
                    Privacy Policy 
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-sm hover:text-brand text-slate-600 dark:text-slate-400"
                    href="/terms-conditions"
                  >
                  Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-sm hover:text-brand text-slate-600 dark:text-slate-400"
                    href="/refund-cancellation-policy"
                  >
                 Refund & Cancellation Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW WITH SOCIAL ICONS */}
        <div className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-700 sm:flex sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} MyThriveBuddy. All rights reserved.
          </p>

          <div className="mt-4 flex space-x-4 sm:mt-0">
            <Link
              href="https://www.linkedin.com/company/mythrivebuddy-com"
              target="_blank"
              className="text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="36"
                height="36"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#0288D1"
                  d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z"
                ></path>
                <path
                  fill="#FFF"
                  d="M12 19H17V36H12zM14.485 17h-.028C12.965 17 12 15.888 12 14.499 12 13.08 12.995 12 14.514 12c1.521 0 2.458 1.08 2.486 2.499C17 15.887 16.035 17 14.485 17zM36 36h-5v-9.099c0-2.198-1.225-3.698-3.192-3.698-1.501 0-2.313 1.012-2.707 1.99C24.957 25.543 25 26.511 25 27v9h-5V19h5v2.616C25.721 20.5 26.85 19 29.738 19c3.578 0 6.261 2.25 6.261 7.274L36 36 36 36z"
                ></path>
              </svg>
            </Link>

            <Link
              href="https://www.instagram.com/mythrivebuddy"
              target="_blank"
              className="text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand"
            >
              <Image src="/ig.png" alt="Instagram" width={36} height={36} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
