import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "../../auth/[...nextauth]/auth.config";
import { prisma } from "@/lib/prisma";

export const GET = async () => {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized", success: false },
        { status: 401 }
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json(
        { message: "User not found", success: false },
        { status: 404 }
      );
    }

    const membership = user.membership;
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        expireAt: { gt: new Date() },
        OR: [
          { audience: "EVERYONE" },
          { audience: "FREE", ...(membership === "FREE" ? {} : { id: "" }) },
          { audience: "PAID", ...(membership === "PAID" ? {} : { id: "" }) },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, announcements }, { status: 200 });
  } catch (error:unknown) {
    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message?: string }).message
        : undefined;
    return NextResponse.json(
      { error: errorMessage || "Internal Server Error to show announcement", sucess: false },
      { status: 500 }
    );
  }
};
