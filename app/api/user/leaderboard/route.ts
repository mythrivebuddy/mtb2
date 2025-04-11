// export const revalidate = 600; // 10 minutes

import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

/**
 * * considerations
 * - cache  --- //* DONE
 * - rate limit
 *
 */
export async function GET(request: NextRequest) {
  try {
    //! commented this just authorization code for testing
    await checkRole(
      "USER",
      "You are not authorized for this action"
    );

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const orderBy = searchParams.get("orderBy") || "jpEarned";

    const validOrderByFields = [
      "jpEarned",
      "jpSpent",
      "jpBalance",
      "jpTransaction",
    ];
    if (!validOrderByFields.includes(orderBy)) {
      return NextResponse.json(
        {
          error: `Invalid orderBy field. Valid fields are: ${validOrderByFields.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    if (limit <= 0) {
      return NextResponse.json(
        { error: "Limit must be greater than 0" },
        { status: 400 }
      );
    }

    // Get total user count
    const totalUsers = await prisma.user.count();

    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / limit);

    // If page exceeds total pages, set it to the last page
    const currentPage = page > totalPages ? totalPages : page;
    const skip = (currentPage - 1) * limit;

    const users = await prisma.user.findMany({
      where: {
        role: "USER",
      },
      orderBy: {
        [orderBy]: "desc",
      },
      omit: {
        password: true,
      },
      take: limit,
      skip: skip,
    });
    console.log(users); //?dev
    if (!users || users.length === 0) {
      return NextResponse.json({ message: "No users found" }, { status: 404 });
    }
    // const updatedUsers = users.map((user) => {
    //   return {
    //     ...user,
    //     jpTransaction: user.jpEarned + user.jpSpent,
    //     jpBalance: user.jpEarned - user.jpSpent,
    //   };
    // });

    // Calculate the starting rank for the current page
    const startingRank = (currentPage - 1) * limit + 1;

    // Add rank to each user
    const usersWithRank = users.map((user, index) => ({
      ...user,
      rank: startingRank + index,
    }));

    return NextResponse.json(
      {
        users: usersWithRank,
        message: "success",
        page: currentPage,
        limit,
        totalUsers,
        totalPages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
