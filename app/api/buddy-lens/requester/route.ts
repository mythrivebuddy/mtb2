import { NextRequest, NextResponse } from "next/server";
import { BuddyLensReviewStatus, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "../../auth/[...nextauth]/auth.config";
import { prisma } from "@/lib/prisma";
import { checkFeature } from "@/lib/access-control/checkFeature";
import { checkRole } from "@/lib/utils/auth";
import { LimitType, UNLIMITED } from "@/lib/access-control/featureConfig";
import { enforceLimitResponse } from "@/lib/access-control/enforceLimitResponse";

// Helper to return error response

function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ message }, { status });
}

// Define interface for pending reviewers
// interface UserSummary {
//   id: string;
//   name: string | null;
//   email: string;
// }
// ! OLD POST API
export async function POST(req: NextRequest) {
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
      // expiresAt,
    } = body;
  
    if (
      !requesterId ||
      !socialMediaUrl ||
      !tier ||
      !domain ||
      !questions ||
      // !expiresAt ||
      !jpCost
    ) {
      return errorResponse("All required fields must be provided");
    }

    if (!Array.isArray(questions)) {
      return errorResponse("Questions must be an array");
    }

    // if (new Date(expiresAt) <= new Date()) {
    //   return errorResponse("Expiration must be a future date");
    // }

    // Validate requesterId exists and has USER role
    const session = await checkRole("USER");
    const featureCheck = checkFeature({
      feature: "buddyLens",
      user: {
        userType: session.user.userType,   // COACH / ENTHUSIAST
        membership: session.user.membership, // FREE / PAID
      },
    });

    if (!featureCheck.allowed) {
      return errorResponse("BuddyLens access not allowed", 403);
    }
    const {
      requestLimitType,
      requestLimit,
      // earnJPPerReview,
    } = featureCheck.config as {
      requestLimitType: LimitType;
      requestLimit: number;
      // earnJPPerReview: number;
    };
    if (requestLimit !== UNLIMITED) {
      const now = new Date();

      let dateFilter: Prisma.BuddyLensRequestWhereInput = {};

      if (requestLimitType === "MONTHLY") {
        dateFilter = {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        };
      }

      if (requestLimitType === "YEARLY") {
        dateFilter = {
          createdAt: {
            gte: new Date(now.getFullYear(), 0, 1),
          },
        };
      }

      // LIFETIME → no date filter

      const usedCount = await prisma.buddyLensRequest.count({
        where: {
          requesterId,
          ...dateFilter,
          isDeleted: false,
        },
      });

      const limitResponse = await enforceLimitResponse({
        limit: requestLimit,
        currentCount: usedCount,
        message: `You have reached your ${requestLimit} ${requestLimitType.toLowerCase()} BuddyLens limit.`,

        statusCode: 403,
      });

      if (limitResponse) {
        return limitResponse;
      }
    }


    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: {
        id: true,
        email: true,
        role: true,
        jpBalance: true,
        name: true,
      }, // Include jpBalance
    });
    if (!requester) {
      return errorResponse("Invalid requester ID", 400);
    }
    if (requester.role !== "USER") {
      return errorResponse("Requester must have USER role", 403);
    }
    
    // Validate if the requester has enough Joy Pearls to set for the review
    if (requester.jpBalance < jpCost) {
      return errorResponse(
        "Insufficient Joy Pearls to create the request",
        400
      );
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
          // expiresAt: new Date(expiresAt),
          status: "OPEN",
        },
      });

      // Deduct the Joy Pearls from the requester
      // await prisma.user.update({
      //   where: { id: requesterId },
      //   data: {
      //     jpBalance: { decrement: jpCost },
      //   },
      // });

      // Fetch all users with USER role, explicitly excluding the requester
      const reviewers = await prisma.user.findMany({
        where: {
          role: "USER",
          id: { not: requesterId }, // Exclude the requester
        },
        select: { id: true, email: true, name: true },
      });

      // Triple-check requester is not in reviewers
      const filteredReviewers = reviewers.filter((r) => r.id !== requesterId);
      if (filteredReviewers.length !== reviewers.length) {
        console.error(
          "Requester included in reviewers despite filter:",
          requesterId
        );
      }
      if (filteredReviewers.some((r) => r.id === requesterId)) {
        return errorResponse(
          "Internal error: Requester included in reviewers",
          500
        );
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
      } 

      return request;
    });

    return NextResponse.json(
      { message: "Request created successfully", data: newRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return errorResponse("Failed to create request", 500);
  }
}

//!OLD API GET: Fetch all requests or a specific request by ID
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    // 1. Get current user (requester)
    const session = await getServerSession(authConfig);
    const UserId = session?.user?.id; // Adjust based on your session user object

    if (id) {
      const request = await prisma.buddyLensRequest.findUnique({
        where: { id },
        include: {
          requester: true,
          // reviewer: {  //?? 9may
          //   select: {
          //     name: true,
          //     email: true, // optional
          //     id: true,
          //   },
          // },
          review: {
            select: {
              reviewer: {
                omit: {
                  password: true,
                },
              },
            },
          },
          // transaction: true, //! deepak chnges
        },
      });

      if (!request || request.isDeleted) {
        return errorResponse("Request not found", 404);
      }

      return NextResponse.json(request, { status: 200 });
    } else {
      const requests = await prisma.buddyLensRequest.findMany({
        where: {
          isDeleted: false,
          // 2. Exclude requests where requesterId === current user id
          requesterId: UserId ? { not: UserId } : undefined,
          status: "OPEN",
          NOT: {
            review: {
              some: {
                OR: [
                  {
                    status: BuddyLensReviewStatus.DISAPPROVED,
                  },
                  {
                    reviewerId: UserId,
                  },
                ],
              },
            },
          },
        },
        include: {
          requester: true,
          // reviewer: true,  //??
          review: {
            include: {
              reviewer: {
                omit: {
                  password: true,
                },
              },
            },
          },
          // transaction: true, //! deepak chnges
        },
      });

      return NextResponse.json(requests, { status: 200 });
    }
  } catch (error) {
    console.error("GET Error:", error);
    return errorResponse("Failed to fetch requests", 500);
  }
}

// ! NEW GET API
// export async function GET(req: NextRequest) {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user?.id) {
//       return errorResponse("Please log in", 401);
//     }

//     const userId = session.user.id;
//     const searchParams = req.nextUrl.searchParams;
//     const id = searchParams.get("id");

//     if (id) {
//       // Fetch a single request by ID
//       const request = await prisma.buddyLensRequest.findUnique({
//         where: { id },
//         include: {
//           requester: {
//             select: { id: true, name: true, email: true },
//           },
//           review: {
//             include: {
//               reviewer: {
//                 select: { id: true, name: true, email: true },
//               },
//             },
//           },
//         },
//       });

//       if (!request || request.isDeleted) {
//         return errorResponse("Request not found", 404);
//       }

//       // Allow requester or any user to view (reviewers access via claims)
//       return NextResponse.json(request, { status: 200 });
//     } else {
//       // Fetch all requests, excluding the user's own for reviewers
//       const requests = await prisma.buddyLensRequest.findMany({
//         where: {
//           isDeleted: false,
//           requesterId: userId ? { not: userId } : undefined,
//         },
//         include: {
//           requester: {
//             select: { id: true, name: true, email: true },
//           },
//           review: {
//             include: {
//               reviewer: {
//                 select: { id: true, name: true, email: true },
//               },
//             },
//           },
//         },
//       });

//       return NextResponse.json(requests, { status: 200 });
//     }
//   } catch (error) {
//     console.error("GET Error:", error);
//     return errorResponse("Failed to fetch requests", 500);
//   }
// }

// PUT: Update a BuddyLens request by ID
export async function PUT(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) return errorResponse("Request ID is required");

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
      // expiresAt,
      status,
    } = body;

    const updateData = {
      ...(socialMediaUrl && { socialMediaUrl }),
      ...(tier && { tier }),
      ...(platform && { platform }),
      ...(feedbackType && { feedbackType }),
      ...(domain && { domain }),
      ...(tags && { tags }),
      ...(questions && { questions }),
      ...(jpCost && { jpCost }),
      // ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      ...(status && { status }),
    };

    const updatedRequest = await prisma.buddyLensRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      { message: "Request updated successfully", data: updatedRequest },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT Error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return errorResponse("Invalid request ID", 400);
    }
    return errorResponse("Failed to update request", 500);
  }
}
