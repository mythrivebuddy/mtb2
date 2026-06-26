// /api/user/getting-started-status
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { GettingStartedStatus } from "@prisma/client";
import { checkRole } from "@/lib/utils/auth";

export async function PATCH() {
  try {
    const session = await checkRole("USER");

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        gettingStartedStatus: GettingStartedStatus.STARTED,
      },
    });

    return NextResponse.json({
      success: true,
      gettingStartedStatus: GettingStartedStatus.STARTED,
      message: "Getting started status updated.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    );
  }
}