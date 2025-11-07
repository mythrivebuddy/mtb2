import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { checkRole } from "@/lib/utils/auth";
import { getServerSession } from "next-auth";
import { authConfig } from "../auth/[...nextauth]/auth.config";

export async function GET() {
  //   const { searchParams } = new URL(req.url);
  //   const userId = searchParams.get("userId");
  // const session = await checkRole("USER");
    const session = await getServerSession(authConfig)
    if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  const userId = session.user.id;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        transaction: true,
        spotlight: true,
        userBusinessProfile: true,
      },
      omit: {
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User fetched successfully", user },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Get user API Error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
