
import { NextResponse } from 'next/server';
import {  Prisma } from '@prisma/client';
import { getServerSession } from "next-auth"; // or however you get the logged-in user
import { authConfig } from '../../auth/[...nextauth]/auth.config';
import {prisma} from '@/lib/prisma';




// Helper to return error response
const errorResponse = (message: string, status: number = 400) =>
  NextResponse.json({ error: message }, { status });

// POST: Create a new BuddyLens request and notify reviewers (excluding requester)
// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const {
//       requesterId,
//       reviewerId,
//       socialMediaUrl,
//       tier,
//       // platform,
//       // feedbackType,
//       domain,
//       // tags = [],
//       questions,
//       jpCost,
//       expiresAt,
//     } = body;

//     if (
//       !requesterId ||
//       !socialMediaUrl ||
//       !tier ||
//       // !platform ||
//       // !feedbackType ||
//       !domain ||
//       !questions ||
//       !expiresAt ||
//       !jpCost
//     ) {
//       return errorResponse('All required fields must be provided');
//     }

//     if (!Array.isArray(questions)) {
//       return errorResponse('Questions must be an array');
//     }

//     if (new Date(expiresAt) <= new Date()) {
//       return errorResponse('Expiration must be a future date');
//     }

//     // Validate requesterId exists and has USER role
//     const requester = await prisma.user.findUnique({
//       where: { id: requesterId },
//       select: { id: true, email: true, role: true },
//     });
//     if (!requester) {
//       return errorResponse('Invalid requester ID', 400);
//     }
//     if (requester.role !== 'USER') {
//       return errorResponse('Requester must have USER role', 403);
//     }
//     console.log('Requester validated:', { id: requester.id, email: requester.email });

//     // Create the request and notifications in a transaction
//     const newRequest = await prisma.$transaction(async (prisma) => {
//       // Create the BuddyLens request
//       const request = await prisma.buddyLensRequest.create({
//         data: {
//           requesterId,
//           ...(reviewerId && { reviewerId }),
//           socialMediaUrl,
//           tier,
//           // platform,
//           // feedbackType,
//           domain,
//           // tags,
//           questions,
//           jpCost,
//           expiresAt: new Date(expiresAt),
//           status: 'OPEN',
//         },
//       });

//       // Fetch all users with USER role, explicitly excluding the requester
//       const reviewers = await prisma.user.findMany({
//         where: {
//           role: 'USER',
//           id: { not: requesterId }, // Exclude the requester
//         },
//         select: { id: true, email: true },
//       });

//       // Log reviewers for debugging
//       console.log('Reviewers queried:', reviewers.map((r) => ({ id: r.id, email: r.email })));

//       // Triple-check requester is not in reviewers
//       const filteredReviewers = reviewers.filter((r) => r.id !== requesterId);
//       if (filteredReviewers.length !== reviewers.length) {
//         console.error('Requester included in reviewers despite filter:', requesterId);
//       }
//       if (filteredReviewers.some((r) => r.id === requesterId)) {
//         console.error('Requester still in filtered reviewers:', requesterId);
//         return errorResponse('Internal error: Requester included in reviewers', 500);
//       }

//       // Create notifications for other users
//       const notifications = filteredReviewers.map((reviewer) => ({
//         userId: reviewer.id,
//         message: `A new BuddyLens request  is available for review!`,
//         read: false,
//         createdAt: new Date(),
//       }));

//       if (notifications.length > 0) {
//         await prisma.userNotification.createMany({
//           data: notifications,
//         });
//         console.log('Notifications created for', notifications.length, 'reviewers');
//       } else {
//         console.log('No other USER role users found to notify');
//       }

//       return request;
//     });

//     return NextResponse.json(
//       { message: 'Request created successfully', data: newRequest },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error('POST Error:', error);
//     return errorResponse('Failed to create request', 500);
//   }
// }


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      requesterId,
      reviewerId,
      socialMediaUrl,
      tier,
      domain,
      questions,
      jpCost,
      expiresAt,
    } = body;

    if (
      !requesterId ||
      !socialMediaUrl ||
      !tier ||
      !domain ||
      !questions ||
      !expiresAt ||
      !jpCost
    ) {
      return errorResponse('All required fields must be provided');
    }

    if (!Array.isArray(questions)) {
      return errorResponse('Questions must be an array');
    }

    if (new Date(expiresAt) <= new Date()) {
      return errorResponse('Expiration must be a future date');
    }

    // Validate requesterId exists and has USER role
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { id: true, email: true, role: true, jpBalance: true }, // Include jpBalance
    });
    if (!requester) {
      return errorResponse('Invalid requester ID', 400);
    }
    if (requester.role !== 'USER') {
      return errorResponse('Requester must have USER role', 403);
    }
    console.log('Requester validated:', { id: requester.id, email: requester.email });

    // Validate if the requester has enough Joy Pearls to set for the review
    if (requester.jpBalance < jpCost) {
      return errorResponse('Insufficient Joy Pearls to create the request', 400);
    }

    // Create the request and notifications in a transaction
    const newRequest = await prisma.$transaction(async (prisma) => {
      // Create the BuddyLens request
      const request = await prisma.buddyLensRequest.create({
        data: {
          requesterId,
          ...(reviewerId && { reviewerId }),
          socialMediaUrl,
          tier,
          domain,
          questions,
          jpCost,
          expiresAt: new Date(expiresAt),
          status: 'OPEN',
        },
      });

      // Deduct the Joy Pearls from the requester
      await prisma.user.update({
        where: { id: requesterId },
        data: {
          jpBalance: { decrement: jpCost },
        },
      });

      // Fetch all users with USER role, explicitly excluding the requester
      const reviewers = await prisma.user.findMany({
        where: {
          role: 'USER',
          id: { not: requesterId }, // Exclude the requester
        },
        select: { id: true, email: true },
      });

      // Log reviewers for debugging
      console.log('Reviewers queried:', reviewers.map((r) => ({ id: r.id, email: r.email })));

      // Triple-check requester is not in reviewers
      const filteredReviewers = reviewers.filter((r) => r.id !== requesterId);
      if (filteredReviewers.length !== reviewers.length) {
        console.error('Requester included in reviewers despite filter:', requesterId);
      }
      if (filteredReviewers.some((r) => r.id === requesterId)) {
        console.error('Requester still in filtered reviewers:', requesterId);
        return errorResponse('Internal error: Requester included in reviewers', 500);
      }

      // Create notifications for other users
      const notifications = filteredReviewers.map((reviewer) => ({
        userId: reviewer.id,
        message: `A new BuddyLens request is available for review!`,
        read: false,
        createdAt: new Date(),
      }));

      if (notifications.length > 0) {
        await prisma.userNotification.createMany({
          data: notifications,
        });
        console.log('Notifications created for', notifications.length, 'reviewers');
      } else {
        console.log('No other USER role users found to notify');
      }

      return request;
    });

    return NextResponse.json(
      { message: 'Request created successfully', data: newRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST Error:', error);
    return errorResponse('Failed to create request', 500);
  }
}


// GET: Fetch all requests or a specific request by ID

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // 1. Get current user (requester)
    const session = await getServerSession(authConfig);
    const currentUserId = session?.user?.id; // Adjust based on your session user object

    if (id) {
      const request = await prisma.buddyLensRequest.findUnique({
        where: { id },
        include: {
          requester: true,
          reviewer: true,
          review: true,
          transaction: true,
        },
      });

      if (!request || request.isDeleted) {
        return errorResponse('Request not found', 404);
      }

      return NextResponse.json(request, { status: 200 });
    } else {
      const requests = await prisma.buddyLensRequest.findMany({
        where: { 
          isDeleted: false,
          // 2. Exclude requests where requesterId === current user id
          requesterId: currentUserId ? { not: currentUserId } : undefined,
        },
        include: {
          requester: true,
          reviewer: true,
          review: true,
          transaction: true,
        },
      });

      return NextResponse.json(requests, { status: 200 });
    }
  } catch (error) {
    console.error('GET Error:', error);
    return errorResponse('Failed to fetch requests', 500);
  }
}
// PUT: Update a BuddyLens request by ID
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return errorResponse('Request ID is required');

  try {
    const body = await req.json();
    const {
      socialMediaUrl,
      tier,
      platform,
      feedbackType,
      domain,
      tags,
      questions,
      jpCost,
      expiresAt,
      status,
    } = body;

    const updateData  = {
      ...(socialMediaUrl && { socialMediaUrl }),
      ...(tier && { tier }),
      ...(platform && { platform }),
      ...(feedbackType && { feedbackType }),
      ...(domain && { domain }),
      ...(tags && { tags }),
      ...(questions && { questions }),
      ...(jpCost && { jpCost }),
      ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      ...(status && { status }),
    };

    const updatedRequest = await prisma.buddyLensRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      { message: 'Request updated successfully', data: updatedRequest },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT Error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return errorResponse('Invalid request ID', 400);
    }
    return errorResponse('Failed to update request', 500);
  }
}

// DELETE: Soft delete a BuddyLens request by ID
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return errorResponse('Request ID is required');

  try {
    await prisma.buddyLensRequest.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json(
      { message: 'Request deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE Error:', error);
    return errorResponse('Failed to delete request', 500);
  }
}
