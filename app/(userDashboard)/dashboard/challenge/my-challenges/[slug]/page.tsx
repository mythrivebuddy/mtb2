import ChallengeManagementPage from "./_components/ChallengeManagementPageComponent";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

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

  const logoUrl = `${baseUrl}/logo.png`;
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: {
      title: true,
      description: true,
    },
  });

  if (!challenge) {
    return {
      title: "Challenges | MythriveBuddy",
    };
  }

  return {
    metadataBase: new URL(baseUrl),
    title: `${challenge.title} | MythriveBuddy`,
    description: challenge.description ?? undefined,

    openGraph: {
      title: `${challenge.title} | MythriveBuddy`,
      description: challenge.description ?? undefined,
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
      title: `${challenge.title} | MythriveBuddy`,
      description: challenge.description ?? undefined,
      images: [logoUrl],
    },
  };
}

export default async function MyChallengePage({ params }: PageProps) {
  const { slug: challengeId } = await params;
  return <ChallengeManagementPage challengeId={challengeId} />;
}
