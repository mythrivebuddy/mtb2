// import { Metadata } from "next";
// import Hero from "@/components/home/Hero";
// import SpotlightCard from "@/components/home/SpotlightCard";
// import AppLayout from "@/components/layout/AppLayout";

// export const metadata: Metadata = {
//   title: "MyThriveBuddy - Solopreneurship Made Amazing",
//   description:
//     "Solopreneurship doesn&apos;t have to be lonely. Join the ecosystem built to make your journey joyful, connected and wildly fulfilling.",
//   openGraph: {
//     title: "MyThriveBuddy - Solopreneurship Made Amazing",
//     description:
//       "Solopreneurship doesn&apos;t have to be lonely. Join the ecosystem built to make your journey joyful, connected and wildly fulfilling.",
//     images: ["/images/og-image.jpg"],
//   },
// };

// // TODO: add current active spotlight get it with api
// export default function Home() {
//   return (
//     <AppLayout>
//       {/*
//     // <main className="min-h-screen bg-gradient-to-br from-[#4A90E2] via-[#F8F2FF] to-[#FF69B4] py-4 sm:py-6 md:py-8 px-4">
//     //   <div className="max-w-[1280px] mx-auto">
//     //     <div className="bg-white/90 backdrop-blur-sm rounded-[32px] p-2 sm:p-6 md:p-8"> */}
//       {/* <Navbar /> */}
//       <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mt-6 sm:mt-8">
//         <div className="flex flex-col justify-between">
//           <Hero />
//         </div>
//         <div className="flex flex-col">
//           <SpotlightCard />
//         </div>
//       </div>

//       {/* </div>
//     //     <CategoryTags />
//     //   </div>
//     // </main> */}
//     </AppLayout>
//     //     <>
//     //     </>
//   );
// }

"use client";

import Image from "next/image";
import comingSoonImage from "../public/Comingsoon.png";

export default function ComingSoon() {
  return (
    <>
      <div className="relative w-screen h-screen">
        <Image
          src={comingSoonImage}
          alt="coming soon"
          layout="fill"
          // objectFit="cover"
          className="object-cover"
          priority
        />
      </div>
    </>
  );
}
