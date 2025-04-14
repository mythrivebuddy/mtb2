import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
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
      keyOfferings: profile?.keyOfferings || null,
      achievements: profile?.achievements || null,
      socialHandles: profile?.socialHandles || {
        github: '',
        twitter: '',
        linkedin: '',
        instagram: '',
      },
      goals: profile?.goals || null,
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

