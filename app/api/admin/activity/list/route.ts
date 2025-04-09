import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/prisma';

export async function GET() {
  try {
    // Check if user is authenticated and is an admin
    // const session = await getServerSession(authOptions);
    // if (!session?.user || session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Fetch all activities
    const activities = await prisma.activity.findMany({
      orderBy: {
        activity: 'asc',
      },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
} 