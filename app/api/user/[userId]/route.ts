import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userBusinessProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Format the response
    const response = {
      name: user.name,
      email: user.email,
      image: user.image,
      keyOfferings: user.userBusinessProfile?.[0]?.keyOfferings || null,
      achievements: user.userBusinessProfile?.[0]?.achievements || null,
      socialHandles: user.userBusinessProfile?.[0]?.socialHandles || null,
      jpEarned: user.jpEarned,
      jpSpent: user.jpSpent,
      jpBalance: user.jpBalance,
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