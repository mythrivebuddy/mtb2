
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EnrollmentStatus } from "@prisma/client"; // Make sure this is imported

export async function GET(
  req: Request,
    { params }: { params: Promise<{ userId: string }> } // Explicitly type params as a Promise
)  {
  try {
    const { userId } = await params;

    if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // We will fetch everything concurrently
    const [
        user,
        dailyBloomsAdded,
        dailyBloomsCompleted,
        miracleLogsCreated,
        challengesCreated,
        challengesJoined,
        challengesCompleted,
        // --- START OF NEW LOGIC ---
        createdChallenges, // Fetches the user's created challenges
        joinedChallenges   // Fetches the user's joined challenges
        // --- END OF NEW LOGIC ---
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          userBusinessProfile: true,
        },
      }),
      prisma.todo.count({ where: { userId: userId } }),
      prisma.todo.count({ where: { userId: userId, isCompleted: true } }),
      prisma.miracleLog.count({ where: { userId: userId } }),
      prisma.challenge.count({ where: { creatorId: userId } }),
      prisma.challengeEnrollment.count({ where: { userId: userId } }),
      prisma.challengeEnrollment.count({ where: { userId: userId, status: EnrollmentStatus.COMPLETED } }),
      // --- START OF NEW LOGIC ---
      prisma.challenge.findMany({
        where: { creatorId: userId },
        select: { id: true, title: true }, // Select only the ID and title
        take: 5, // Limit to the 5 most recent
        orderBy: { createdAt: 'desc' }
      }),
      prisma.challengeEnrollment.findMany({
        where: { userId: userId },
        select: {
          challenge: { // Select the related challenge's details
            select: { id: true, title: true }
          }
        },
        take: 5, // Limit to the 5 most recent
        orderBy: { joinedAt: 'desc' }
      })
      // --- END OF NEW LOGIC ---
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profile = user.userBusinessProfile?.[0];

    const response = {
      name: user.name,
      email: user.email,
      image: user.image,
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
      // --- START OF NEW LOGIC ---
      createdChallenges,
      // The joinedChallenges data is nested, so we simplify it here
      joinedChallenges: joinedChallenges.map(enrollment => enrollment.challenge),
      // --- END OF NEW LOGIC ---
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}