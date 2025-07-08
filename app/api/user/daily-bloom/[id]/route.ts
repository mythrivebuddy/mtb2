/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { dailyBloomSchema } from "@/schema/zodSchema";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { assignJp } from "@/lib/utils/jp";
import { ActivityType } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bloom = await prisma?.todo.findUnique({
      where: { id: params.id },
    });

    if (!bloom)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(bloom);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch entry" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await checkRole("USER");
    const body = await req.json();

    // 1. Find existing bloom
    const existing = await prisma?.todo.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // 3. Full form update
    const validated = dailyBloomSchema.parse(body);

    const updated = await prisma?.todo.update({
      where: { id: params.id },
      data: validated,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "error while updating a Daily Bloom", success: false },
        { status: 500 }
      );
    }

    if (updated.isCompleted === true) {
      // assign jp and first check the todo where the isComplete is true or not

      const user = await prisma.user.findUnique({
        where: { id: session?.user?.id },
        include: { plan: true },
      });

      if (user) {
        try {
          // assign Award JP points for daily bloom completion and mark the newBloom true
          await assignJp(user, ActivityType.DAILY_BLOOM_COMPLETION_REWARD);
          await prisma.todo.update({
            where: { id: updated?.id },
            data: { taskCompleteJP: true },
          });
        } catch (error: any) {
          console.log(
            `Error while assigning the jp from the completion of the daily bloom task : ${error.message}`
          );
          throw error;
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma?.todo.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
