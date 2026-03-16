// /api/user/billing-info
import { checkRole } from "@/lib/utils/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async () => {
    try {
        const session = await checkRole(["USER", "ADMIN"]);
        let billingInfo = null;
        billingInfo = await prisma.billingInformation.findUnique({
            where: { userId: session.user.id },
        });
        if (!billingInfo) {
            billingInfo = await prisma.userBillingInformation.findUnique({
                where: { userId: session.user.id },
            });
        }

        return NextResponse.json({ billingInfo });
    } catch (error) {
        console.error("Error fetching billing info:", error);
        return NextResponse.json({ error: "Failed to fetch billing info" }, { status: 500 });
    }
}
