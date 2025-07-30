// File: app/api/user/[userId]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userBusinessProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profile = user.userBusinessProfile?.[0];

    const response = {
      name: user.name,
      email: user.email,
      image: user.image,
     

      bio: user.bio || null, // This retrieves the bio saved from the "My Profile" page
    
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}