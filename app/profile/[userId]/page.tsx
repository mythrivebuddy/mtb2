import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EnrollmentStatus } from "@prisma/client";
import { Metadata } from "next";
import UserPublicProfile from "@/components/public-profile/UserPublicProfile";

interface PageProps {
  params: { userId: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { userId } = await params;

  const baseUrl = process.env.NEXT_URL;

  if (!userId) {
    return {
      metadataBase: baseUrl ? new URL(baseUrl) : undefined,
      title: "Profile",
      description: "View profile",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      userType: true,
      bio: true,
      jpEarned: true,
      jpSpent: true,
      jpBalance: true,
      jpTransaction: true,
      userBusinessProfile: {
        select: {
          profilePhoto: true,
          businessInfo: true,
          keyOfferings: true,
          achievements: true,
          socialHandles: true,
          goals: true,
          missionStatement: true,
          featuredWorkTitle: true,
          featuredWorkDesc: true,
          website: true,
          tagline: true,
          transformation: true,
          typicalResults: true,
        },
      },
    },
  });
  if (!user) {
    return {
      metadataBase: baseUrl ? new URL(baseUrl) : undefined,
      title: "Profile not found",
      description: "This profile does not exist",
    };
  }

  const profile = user.userBusinessProfile;

  // ✅ Name
  const name = user.name || "Profile";

  // ✅ Image (must be PUBLIC URL)
  const image = profile?.profilePhoto || user.image || "";

  // ✅ Description (Tagline + Outcome)
  const description = [
    profile?.tagline,
    profile?.transformation,
    ...(Array.isArray(profile?.typicalResults)
      ? profile.typicalResults.slice(0, 2)
      : []),
  ]
    .filter(Boolean)
    .join(" • ");

  const finalDescription = description || "View profile";

  const profileUrl = baseUrl ? `${baseUrl}/profile/${userId}` : undefined;

  return {
    metadataBase: baseUrl ? new URL(baseUrl) : undefined,

    title: `${name} | Profile`,
    description: finalDescription,

    openGraph: {
      title: `${name} | Profile`,
      description: finalDescription,
      url: profileUrl,
      siteName: "MyThriveBuddy",
      type: "profile",
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: name,
            },
          ]
        : [],
    },

    twitter: {
      card: "summary_large_image",
      title: `${name} | Profile`,
      description: finalDescription,
      images: image ? [image] : [],
    },
  };
}
export default async function UserProfilePage({ params }: PageProps) {
  const { userId } = await params;

  if (!userId) return notFound();

  const [
    user,
    dailyBloomsAdded,
    dailyBloomsCompleted,
    miracleLogsCreated,
    challengesCreated,
    challengesJoined,
    challengesCompleted,
    createdChallenges,
    joinedChallenges,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { userBusinessProfile: true },
    }),
    prisma.todo.count({ where: { userId } }),
    prisma.todo.count({ where: { userId, isCompleted: true } }),
    prisma.miracleLog.count({ where: { userId } }),
    prisma.challenge.count({ where: { creatorId: userId } }),
    prisma.challengeEnrollment.count({ where: { userId } }),
    prisma.challengeEnrollment.count({
      where: { userId, status: EnrollmentStatus.COMPLETED },
    }),
    prisma.challenge.findMany({
      where: { creatorId: userId },
      select: { id: true, title: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.challengeEnrollment.findMany({
      where: { userId },
      select: { challenge: { select: { id: true, title: true } } },
      take: 5,
      orderBy: { joinedAt: "desc" },
    }),
  ]);

  if (!user) return notFound();

  const profile = user.userBusinessProfile;

  const userData = {
    ...profile,
    name: user.name,
    email: user.email,
    image: user.image,
    userType: user.userType,
    bio: user.bio || null,
    businessInfo: profile?.businessInfo || null,
    keyOfferings: profile?.keyOfferings || null,
    achievements: profile?.achievements || null,
    socialHandles: profile?.socialHandles || {},
    goals: profile?.goals || null,
    missionStatement: profile?.missionStatement || null,
    featuredWorkTitle: profile?.featuredWorkTitle || null,
    featuredWorkDesc: profile?.featuredWorkDesc || null,
    website: profile?.website || null,
    jpEarned: user.jpEarned,
    jpSpent: user.jpSpent,
    jpBalance: user.jpBalance,
    jpTransaction: user.jpTransaction,
    dailyBloomsAdded,
    dailyBloomsCompleted,
    miracleLogsCreated,
    challengesCreated,
    challengesJoined,
    challengesCompleted,
    createdChallenges,
    joinedChallenges: joinedChallenges.map((e) => e.challenge),
  };

  return <UserPublicProfile userId={userId} userData={userData} />;
}
