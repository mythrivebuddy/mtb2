import { Metadata } from "next";
import Hero from "@/components/home/Hero";
import SpotlightCard from "@/components/home/SpotlightCard";
import AppLayout from "@/components/layout/AppLayout";
import Pillars from "@/components/home/Pillars";
import CoachVsGrowth from "@/components/home/CoachVSGrowth";
import Features from "@/components/home/Features";
import ThreePillars from "@/components/home/ThreePillars";
import CTA from "@/components/home/CTA";
import Philosophy from "@/components/home/Philosophy";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title:
    "MyThriveBuddy - Your Personal & Professional Growth Environment For Coaches, Solopreneurs & Self-Growth Enthusiasts.",
  description:
    "A structured environment that makes consistent growth inevitable — without hustle, hype, or burnout.",
  openGraph: {
    title:
      "MyThriveBuddy - Your Personal & Professional Growth Environment For Coaches, Solopreneurs & Self-Growth Enthusiasts.",
    description:
      "A structured environment that makes consistent growth inevitable — without hustle, hype, or burnout.",
    url: "https://mythrivebuddy.com",
    siteName: "MyThriveBuddy",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "MyThriveBuddy - Your Personal & Professional Growth Environment For Coaches, Solopreneurs & Self-Growth Enthusiasts.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "MyThriveBuddy - Your Personal & Professional Growth Environment For Coaches, Solopreneurs & Self-Growth Enthusiasts.",
    description:
      "A structured environment that makes consistent growth inevitable — without hustle, hype, or burnout.",
    images: ["/logo.png"],
  },
};
type HomeProps = {
  searchParams?: {
    from?: string;
  };
};

export default async function Home({ searchParams }: HomeProps) {
  const session = await getServerSession(authOptions);
  const queryString = await searchParams;
  const from = queryString?.from;
  const allowHome = from === "user-consent";
  if (session && !allowHome) {
    if (session.user?.role === "ADMIN") {
      redirect("/admin/dashboard");
    } else {
      redirect("/dashboard");
    } 
  }
  return (
    <>
      <AppLayout>
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mt-6 sm:mt-8">
          <div className="flex flex-col justify-between">
            <Hero />
          </div>
          <div className="hidden lg:flex flex-col ">
            <SpotlightCard />
          </div>
        </div>
        <Pillars />
        <CoachVsGrowth />
        <Features />
        <ThreePillars />
        <Philosophy />
        <CTA />
      </AppLayout>
    </>
  );
}
