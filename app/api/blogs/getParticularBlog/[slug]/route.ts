import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const desluggedTitle = slug.replace(/-/g, " ").toLowerCase();

  try {
    const blog = await prisma.blog.findFirst({
      where: {
        title: {
          equals: desluggedTitle,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        image: true,
        content: true,
        readTime: true,
      },
    });
    console.log(blog);

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}
