// app/api/accountability-hub/groups/[groupId]/cycles/[cycleId]/update-status/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PATCH(
    request: Request,
    { params }: { params: { groupId: string; cycleId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get("groupId");
        // 1. Check for authenticated user
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Get data from request
        const { cycleId } = params;
        const { status } = await request.json();
        if (!groupId || !cycleId) {
            return NextResponse.json({ message: " Missing groupId or cycleId" }, { status: 400 });
        }
        // 3. Validate input
        if (status !== "completed") {
            return NextResponse.json(
                { message: "Invalid status update" },
                { status: 400 }
            );
        }

        // You can add auth checks here: e.g., ensure user is admin of this group

        // 4. Update the cycle in the database
        const updatedCycle = await prisma.cycle.update({
            where: {
                id: cycleId,
                groupId: groupId,
            },
            data: {
                status: "completed",
            },
        });

        // 5. Return the updated cycle
        return NextResponse.json(updatedCycle, { status: 200 });
    } catch (error) {
        console.error("Failed to update cycle:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}