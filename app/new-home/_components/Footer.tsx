import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-6">
      <div className="py-4">
        {/* TOP GRID */}
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Logo + description */}
          <div>
            <div className="flex items-center gap-3">
             <Image src="/logo.png" height={36} width={36} alt="Logo"/>
              <h2 className="text-xl font-bold dark:text-white">
                MyThriveBuddy
              </h2>
            </div>

            <p className="mt-4 text-md text-slate-600 dark:text-slate-400">
              Your growth home for tools, mindset, visibility, and momentum.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:col-span-3 gap-8">
            <div>
              <h3 className="font-semibold dark:text-white">Product</h3>
              <ul className="mt-4 space-y-3">
                {["Benefits", "Pricing", "Challenges"].map((i) => (
                  <li key={i}>
                    <a
                      className="text-sm hover:text-brand text-slate-600 dark:text-slate-400"
                      href="#"
                    >
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold dark:text-white">Learn</h3>
              <ul className="mt-4 space-y-3">
                {["Blog", "Webinars", "FAQs", "Help Center"].map((i) => (
                  <li key={i}>
                    <a
                      className="text-sm hover:text-brand text-slate-600 dark:text-slate-400"
                      href="#"
                    >
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold dark:text-white">Company</h3>
              <ul className="mt-4 space-y-3">
                {["About", "Contact", "Future Vision"].map((i) => (
                  <li key={i}>
                    <a
                      className="text-sm hover:text-brand text-slate-600 dark:text-slate-400"
                      href="#"
                    >
                      {i}
                    </a>
                  </li>
                ))}
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
