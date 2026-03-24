// route : /api/user/store/items/get-items-by-creatorid
import { checkRole } from "@/lib/utils/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
    try {
        const session = await checkRole(["ADMIN", "USER"]);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const items = await prisma.item.findMany({
            where: { createdByUserId: userId },
            include: {
                category: { select: { id: true, name: true } },
                approver: { select: { id: true, name: true, email: true } },
                creator: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(
            {
                items: items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    categoryId: item.categoryId,
                    category: item.category,
                    basePrice: item.basePrice,
                    monthlyPrice: item.monthlyPrice,
                    yearlyPrice: item.yearlyPrice,
                    lifetimePrice: item.lifetimePrice,
                    currency: item.currency,
                    imageUrl: item.imageUrl,
                    downloadUrl: item.downloadUrl,
                    isApproved: item.isApproved,
                    approvedByUserId: item.approvedByUserId,
                    approvedAt: item.approvedAt?.toISOString() || null,
                    approver: item.approver,
                    createdByUserId: item.createdByUserId,
                    createdByRole: item.createdByRole,
                    creator: item.creator,
                    createdAt: item.createdAt.toISOString(),
                    updatedAt: item.updatedAt.toISOString(),
                })),
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error fetching items:", error);
        return NextResponse.json(
            { error: "Failed to fetch items" },
            { status: 500 },
        );
    }
}
