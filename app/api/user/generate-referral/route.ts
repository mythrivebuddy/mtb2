import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";
import { checkRole } from "@/lib/utils/auth";

export const POST = async () => {
  try {
    // ✅ 1. Get session
    const session = await checkRole("USER");

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // ✅ 2. Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // ✅ 3. If already exists → return it
    if (existingUser.referralCode) {
      return NextResponse.json({
        referralCode: existingUser.referralCode,
      });
    }

    // ✅ 4. Generate unique referral code (retry-safe)
    let referralCode = "";
    let isUnique = false;

    while (!isUnique) {
      referralCode = nanoid(8);

      const existing = await prisma.user.findUnique({
        where: { referralCode },
        select: { id: true },
      });

      if (!existing) isUnique = true;
    }

    // ✅ 5. Save to DB
    await prisma.user.update({
      where: { id: userId },
      data: { referralCode },
    });

    // ✅ 6. Return
    return NextResponse.json({ referralCode });

  } catch (error) {
    console.error("Generate referral error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
};