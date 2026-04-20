import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function POST(req: Request) {
  try {
    const session = await checkRole("USER");

    const { timezone } = await req.json();

    if (!timezone || typeof timezone !== "string") {
      return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
    }

    const userId = session.user.id;

    //  Get current user timezone
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    //  Avoid unnecessary updates
    if (existingUser.timezone === timezone) {
      return NextResponse.json(
        { message: "Timezone already up to date" },
        { status: 200 },
      );
    }

    //  Update timezone
    await prisma.user.update({
      where: { id: userId },
      data: { timezone },
    });

    return NextResponse.json(
      { message: "Timezone updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Timezone API Error:",
      error instanceof Error ? error.message : error,
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
