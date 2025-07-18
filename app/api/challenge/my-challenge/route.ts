// File: app/api/challenge/my-challenge/route.ts

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

// Function signature ko aesa hona chahiye static routes ke liye
export async function GET(request: NextRequest) {
  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    // Query parameters ko is tarah se read karte hain
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'hosted' ya 'joined'

    let challenges;

    if (type === 'hosted') {
      // User ke banaye hue challenges fetch karo
      challenges = await prisma.challenge.findMany({
        where: {
          creatorId: userId,
        },
        // ... baaki options
      });
    } else if (type === 'joined') {
      // User ke join kiye hue challenges fetch karo
      challenges = await prisma.challenge.findMany({
        where: {
          enrollments: {
            some: {
              userId: userId,
            },
          },
        },
        // ... baaki options
      });
    } else {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    return NextResponse.json(challenges);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    // --- YEH FIX HAI ---
    // Yahan se dynamic context.params.slug hata diya hai
    console.error(`GET /api/challenge/my-challenge Error:`, errorMessage, error);
    
    return new NextResponse(JSON.stringify({ error: "Internal Server Error", details: errorMessage }), { status: 500 });
  }
}