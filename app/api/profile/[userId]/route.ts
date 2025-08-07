
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { EnrollmentStatus } from "@prisma/client";

// export async function GET(
//   req: Request,
//   { params }: { params: { userId: string } }
// ) {
//   try {
//     const { userId } =  params;

//     if (!userId) {
//         return NextResponse.json({ error: "User ID is required" }, { status: 400 }); 
//     }

//     // Fetch the primary user data and the aggregate counts concurrently for efficiency.
//     const [user, dailyBloomsAdded, dailyBloomsCompleted, miracleLogsCreated, challengesCreated, challengesJoined, challengesCompleted] = await Promise.all([
//       // Fetch user and their business profile
//       prisma.user.findUnique({
//         where: { id: userId },
//         include: {
//           userBusinessProfile: true,
//         },
//       }),
//       // --- START OF ADDED LOGIC ---
//       // Count all todos for this user
//       prisma.todo.count({
//         where: { userId: userId },
//       }),
//       // Count only completed todos for this user
//       prisma.todo.count({
//         where: { userId: userId, isCompleted: true },
//       }),
//       // Count all miracle logs for this user
//       prisma.miracleLog.count({
//         where: { userId: userId },
//       }),
//       // Count all challenges created by this user
//       prisma.challenge.count({
//         where: { creatorId: userId },
//       }),
//       // Count all challenges this user has joined
//       prisma.challengeEnrollment.count({
//         where: { userId: userId },
//       }),
//       // Count all challenges this user has completed
//       prisma.challengeEnrollment.count({
//         where: { userId: userId, status: EnrollmentStatus.COMPLETED },
//       }),
//       // --- END OF ADDED LOGIC ---
//     ]);

//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     const profile = user.userBusinessProfile?.[0];

//     // Combine the original user data with the new, freshly calculated stats
//     const response = {
//       // Original user and profile data
//       name: user.name,
//       email: user.email,
//       image: user.image,
//       bio: user.bio || null,
//       businessInfo: profile?.businessInfo || null,
//       keyOfferings: profile?.keyOfferings || null,
//       achievements: profile?.achievements || null,
//       socialHandles: profile?.socialHandles || {},
//       goals: profile?.goals || null,
//       missionStatement: profile?.missionStatement || null,
//       featuredWorkTitle: profile?.featuredWorkTitle || null,
//       featuredWorkDesc: profile?.featuredWorkDesc || null,
//       website: profile?.website || null,
//       jpEarned: user.jpEarned,
//       jpSpent: user.jpSpent,
//       jpBalance: user.jpBalance,
//       jpTransaction: user.jpTransaction,

//       // --- ADDED STATS ---
//       // These values are now calculated live from the database
//       dailyBloomsAdded: dailyBloomsAdded,
//       dailyBloomsCompleted: dailyBloomsCompleted,
//       miracleLogsCreated: miracleLogsCreated,
//       challengesCreated: challengesCreated,
//       challengesJoined: challengesJoined,
//       challengesCompleted: challengesCompleted,
//     };

//     return NextResponse.json(response);

//   } catch (error) {
//     console.error("Error fetching user profile:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// // Optional but recommended: To prevent aggressive caching on platforms like Vercel
// export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EnrollmentStatus } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> } // Explicitly type params as a Promise
) {
  try {
    // Await params to resolve the Promise and destructure userId
    const { userId } = await params;

    // Validate userId
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch user data and aggregate counts concurrently
    const [
      user,
      dailyBloomsAdded,
      dailyBloomsCompleted,
      miracleLogsCreated,
      challengesCreated,
      challengesJoined,
      challengesCompleted,
    ] = await Promise.all([
      // Fetch user and their business profile
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          userBusinessProfile: true,
        },
      }),
      // Count all todos for this user
      prisma.todo.count({
        where: { userId },
      }),
      // Count completed todos for this user
      prisma.todo.count({
        where: { userId, isCompleted: true },
      }),
      // Count all miracle logs for this user
      prisma.miracleLog.count({
        where: { userId },
      }),
      // Count all challenges created by this user
      prisma.challenge.count({
        where: { creatorId: userId },
      }),
      // Count all challenges this user has joined
      prisma.challengeEnrollment.count({
        where: { userId },
      }),
      // Count all challenges this user has completed
      prisma.challengeEnrollment.count({
        where: { userId, status: EnrollmentStatus.COMPLETED },
      }),
    ]);

    // Check if user exists
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract the first business profile (if it exists)
    const profile = user.userBusinessProfile?.[0];

    // Construct response object
    const response = {
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio ?? null,
      businessInfo: profile?.businessInfo ?? null,
      keyOfferings: profile?.keyOfferings ?? null,
      achievements: profile?.achievements ?? null,
      socialHandles: profile?.socialHandles ?? {},
      goals: profile?.goals ?? null,
      missionStatement: profile?.missionStatement ?? null,
      featuredWorkTitle: profile?.featuredWorkTitle ?? null,
      featuredWorkDesc: profile?.featuredWorkDesc ?? null,
      website: profile?.website ?? null,
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Prevent aggressive caching (e.g., on Vercel)
export const dynamic = "force-dynamic";