import { Metadata } from "next";
import SiginUpPageContent from "@/components/auth/SiginUpPageContent";

export const metadata: Metadata = {
  title: "Sign Up - MyThriveBuddy",
  description: "Create your MyThriveBuddy account and start your solopreneurship journey today",
  openGraph: {
    title: "Sign Up - MyThriveBuddy",
    description: "Create your MyThriveBuddy account and start your solopreneurship journey today",
    url: "https://mythrivebuddy.com/signup",
    siteName: "MyThriveBuddy",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sign Up - MyThriveBuddy",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign Up - MyThriveBuddy",
    description: "Create your MyThriveBuddy account and start your solopreneurship journey today",
    images: ["/images/og-image.jpg"],
  },
};

export default function SignUpPage() {
  return <SiginUpPageContent />;
}
