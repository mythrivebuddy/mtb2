import { MtbPlantSeedIcon, MtbThreeUsersIcon } from "@/icons/mtb-icons";
import { theme } from "@/lib/new-home/theme/theme";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

const Footer = () => (
  <footer
    className={
      theme.bgPrimary +
      " w-full"
    }
  >
    <div className="pb-3 sm:pb-6 pt-8 sm:pt-20 px-4 sm:px-6 md:px-12 max-w-[1440px] mx-auto">

    
    <div className="grid md:grid-cols-12 gap-12 mb-10 sm:mb-16">
      <div className="md:col-span-5">
        <Link href="/" className="flex items-center gap-2 mb-7">
          <img
            src="/new-home-assets/new-logo.png"
            className="h-[52px] w-[52px] sm:w-[68px] sm:h-[68.5px]"
          />
          <span
            className={theme.typography.brandFooterHeading}
          >
            My<span className={theme.highLightTextColor}>Thrive</span>Buddy
          </span>
        </Link>
        <p className="text-xs sm:text-base mb-10 leading-relaxed">
          A calmer space for structure,
          <br />
          growth, and lasting consistency.
        </p>

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2 text-xs ">
            <div
              className={
                theme.highLightTextColor +
                " border " +
                theme.borderLight +
                " w-10 h-10 rounded-full bg-white flex items-center justify-center "
              }
            >
              <MtbThreeUsersIcon className="w-6 h-6" />
            </div>
            Supportive
            <br />
            Community
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div
              className={
                theme.highLightTextColor +
                " border " +
                theme.borderLight +
                " w-10 h-10 rounded-full bg-white  flex items-center justify-center "
              }
            >
              <MtbPlantSeedIcon className="w-6 h-6" />
            </div>
            Growth
            <br />
            Environment
          </div>
          <div className="flex items-center gap-2 text-xs text-[#5A5048]">
            <div className="w-10 h-10 rounded-full bg-white border border-[#E6D9CA] flex items-center justify-center text-[#B87042]">
              <TrendingUp className="w-6 h-6" />
            </div>
            Sustainable
            <br />
            Momentum
          </div>
        </div>
      </div>

      <div className="col-span-full md:col-span-7 grid grid-cols-3 md:grid-cols-3 gap-6 md:gap-0">
        <div>
          <h3 className="text-base sm:text-2xl mb-6">Platform</h3>
          <ul className="space-y-4 text-xs sm:text-xl">
            <li>
              <a href="#" className="hover:text-[#B87042]">
                <h3>Features</h3>
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#B87042]">
                <h3>How It Works</h3>
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#B87042]">
                <h3>Pricing</h3>
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#B87042]">
                <h3>Community</h3>
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-base sm:text-2xl mb-6">Resources</h3>
          <ul className="space-y-4 text-xs sm:text-xl">
            <li>
              <a href="#" className="hover:text-[#B87042]">
                <h3>Blog</h3>
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#B87042]">
                <h3>Guides</h3>
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#B87042]">
                <h3>Webinars</h3>
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#B87042]">
                <h3>FAQs</h3>
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-base sm:text-2xl mb-6">Company</h3>
          <ul className="space-y-4 text-xs sm:text-xl">
            <li>
              <a href="#" className="hover:text-[#B87042]">
                <h3>About MTB</h3>
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#B87042]">
                <h3>Contact</h3>
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#B87042]">
                <h3>Terms & Conditions</h3>
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#B87042]">
                <h3>Refund Policy</h3>
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#B87042]">
                <h3>Privacy Policy</h3>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div
      className={`border-t  ${theme.hightLightBorderColor}  pt-8 flex items-center justify-between text-sm sm:text-xl tracking-[0.05em]`}
    >
      <p>© {new Date().getFullYear()} MyThriveBuddy. All rights reserved.</p>
    </div>
    </div>
  </footer>
);
export default Footer;
