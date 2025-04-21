import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract pagination and category parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "6");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 && limit <= 100 ? limit : 6;
    const skip = (validPage - 1) * validLimit;

    // Build a where clause if a category filter is provided
    const where: any = {};
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }
    if (category) {
      where.category = category;
    }

    // Get total count for the filtered query
    const totalCount = await prisma.blog.count({ where });

    // Fetch blogs with filtering and pagination
    const blogs = await prisma.blog.findMany({
      skip,
      take: validLimit,
      orderBy: { createdAt: "desc" },
      where,
      select: {
        id: true,
        title: true,
        excerpt: true,
        image: true,
        category: true,
        content: true,
        readTime: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Blogs retrieved successfully",
      blogs,
      totalCount,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(totalCount / validLimit),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Blog API Error:", errorMessage);
    return NextResponse.json(
      { error: "Failed to fetch blogs", message: errorMessage },
      { status: 500 }
    );
  }
}
