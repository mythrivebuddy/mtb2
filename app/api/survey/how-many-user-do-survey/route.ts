import {NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async () => {
  try {
    const userCount = await prisma.user.count({
      where: {
        isFirstTimeSurvey: false,
      },
    });
        const users = await prisma.user.findMany();
    // console.log("All users in DB:", users);
    return NextResponse.json({ userCount }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch user count: ${error}` },
      { status: 500 }
    );
  }
};
