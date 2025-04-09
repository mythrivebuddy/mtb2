import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import { z } from 'zod';

const updateJpSchema = z.object({
  activityId: z.string().uuid(),
  jpAmount: z.number().int().min(0),
});

export async function POST(req: Request) {
  try {
    // Check if user is authenticated and is an admin
    // const session = await getServerSession(authOptions);
    // if (!session?.user || session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateJpSchema.parse(body);

    // Update the activity
    const updatedActivity = await prisma.activity.update({
      where: { id: validatedData.activityId },
      data: { jpAmount: validatedData.jpAmount },
    });

    return NextResponse.json({
      success: true,
      data: updatedActivity,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating activity JP amount:', error);
    return NextResponse.json(
      { error: 'Failed to update activity JP amount' },
      { status: 500 }
    );
  }
} 