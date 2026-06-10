import assets from "@/lib/constants/assets";
import ChallengeManagementPage from "./_components/ChallengeManagementPageComponent";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

type PageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug: challengeId } = await params;
  const baseUrl = process.env.NEXT_URL || "https://www.mythrivebuddy.com";

  const logoUrl = `${baseUrl}${assets.logo.current}?v=2`;

  
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: {
      title: true,
      description: true,

    },
  
  });

  if (!challenge) {
    return {
      title: "Challenges | MyThriveBuddy",
    };
  }
const description = challenge.description
  ?.replace(/<[^>]*>/g, "")
  .replace(/&ndash;/g, "–")
  .replace(/&amp;/g, "&")
  .replace(/&bull;/g, "•")
  .replace(/&nbsp;/g, " ")
  .trim()
  .slice(0, 160) ?? "";
  // for sharing we need this url upcoming-challenges/{challengeId}
  return {
    metadataBase: new URL(baseUrl),
    title: `${challenge.title} | MyThriveBuddy`,
    description,

    openGraph: {
      title: `${challenge.title} | MyThriveBuddy`,
      description,
      url: `${baseUrl}/dashboard/challenge/my-challenges/${challengeId}`,
      siteName: "MyThriveBuddy",
      images: [
        {
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: challenge.title,
        },
      ],
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: `${challenge.title} | MyThriveBuddy`,
      description,
      images: [logoUrl],
    },
    alternates: {
      canonical: `${baseUrl}/dashboard/challenge/my-challenges/${challengeId}`,
    },
  };
}

export default async function MyChallengePage({ params }: PageProps) {
  const { slug: challengeId } = await params;
   const session = await getServerSession(authOptions);
    const participant = await prisma.challengeEnrollment.findFirst({
    where: {
      challengeId,
      userId: session?.user.id,
    },
  });

  // 3. not joined → send to upcoming so they can join
  if (!participant) {
    redirect(`/dashboard/challenge/upcoming-challenges/${challengeId}`);
  }
  return <ChallengeManagementPage challengeId={challengeId} />;
}
