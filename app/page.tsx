import { Metadata } from "next";
import Hero from "@/components/home/Hero";
import SpotlightCard from "@/components/home/SpotlightCard";
import AppLayout from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "MyThriveBuddy - Solopreneurship Made Amazing",
  description:
    "Join the world's only platform / ecosystem that aims to provide growth, joy, sense of belonging.",
  openGraph: {
    title: "MyThriveBuddy - Solopreneurship Made Amazing",
    description:
      "Join the world's only platform / ecosystem that aims to provide growth, joy, sense of belonging.",
    images: ["/images/og-image.jpg"],
  },
};

// TODO: add current active spotlight get it with api
export default function Home() {
  return (
    <AppLayout>
      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mt-6 sm:mt-8">
        <div className="flex flex-col justify-between order-2 md:order-none">
          <Hero />
        </div>
        <div className="flex flex-col order-1 md:order-none">
          <SpotlightCard />
        </div>
      </div>
    </AppLayout>
  );
}
