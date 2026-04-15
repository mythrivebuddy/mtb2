// /api/user/dashboard-content
import { checkRole } from "@/lib/utils/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async (req: Request) => {
  try {
    const session = await checkRole("USER");

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const program = await prisma.program.findFirst({
      where: { slug: "2026-complete-makeover" },
    });

    if (!program) {
      return NextResponse.json(
        { message: "Program not found" },
        { status: 404 },
      );
    }

    const userMakeoverCommitment = await prisma.userMakeoverCommitment.findMany(
      {
        where: {
          userId: session.user.id,
          programId: program.id,
        },
        include: {
          area: {
            select: { id: true, name: true },
          },
        },
      },
    );

    // ✅ USE FRONTEND TIME
    const alignedAction = await prisma.alignedAction.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: start ? new Date(start) : undefined,
          lte: end ? new Date(end) : undefined,
        },
      },
      select: {
        id: true,
        completed: true,
        selectedTask: true,
        tasks: true,
        timeFrom: true,
        timeTo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      { userMakeoverCommitment, alignedAction },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 },
    );
  }
};
