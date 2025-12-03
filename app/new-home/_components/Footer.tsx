import { Linkedin, Instagram, Dribbble } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-100 dark:bg-slate-900 mt-8">
      <div className="px-4 sm:px-24 py-16">

        {/* TOP GRID */}
        <div className="grid lg:grid-cols-4 gap-12">

          {/* Logo + description */}
          <div>
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-primary" viewBox="0 0 48 48" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z"
                />
              </svg>
              <h2 className="text-xl font-bold dark:text-white">MyThriveBuddy</h2>
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
                    <a className="text-sm hover:text-primary text-slate-600 dark:text-slate-400" href="#">
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
                    <a className="text-sm hover:text-primary text-slate-600 dark:text-slate-400" href="#">
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
                    <a className="text-sm hover:text-primary text-slate-600 dark:text-slate-400" href="#">
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
            © 2024 MyThriveBuddy. All rights reserved.
          </p>

          <div className="mt-4 flex space-x-6 sm:mt-0">

            <a href="#" className="text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand">
              <Linkedin className="h-5 w-5" />
            </a>

            <a href="#" className="text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand">
              <Instagram className="h-5 w-5" />
            </a>

            <a href="#" className="text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand">
              <Dribbble className="h-5 w-5" />
            </a>

          </div>
        </div>
      </div>
    </footer>
  );
}
