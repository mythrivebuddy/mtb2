import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EnrollmentStatus } from "@prisma/client";
import UserPublicProfile from "@/components/public-profile/UserPublicProfile";

interface PageProps {
  params: { userId: string };
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
    prisma.challengeEnrollment.count({ where: { userId, status: EnrollmentStatus.COMPLETED } }),
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