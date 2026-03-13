import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user's internal ID from session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Fetch orders with items and their details
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        totalAmount: order.totalAmount,
        currency: order.currency, // ✅ Order's payment currency
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map((orderItem) => ({
          id: orderItem.id,
          quantity: orderItem.quantity,
          priceAtPurchase: orderItem.priceAtPurchase, // ✅ Converted price
          originalPrice: orderItem.originalPrice, // ✅ Original price before conversion
          originalCurrency: orderItem.originalCurrency, // ✅ Original currency
          item: {
            id: orderItem.item.id,
            name: orderItem.item.name,
            imageUrl: orderItem.item.imageUrl,
            basePrice: orderItem.item.basePrice,
            monthlyPrice: orderItem.item.monthlyPrice,
            downloadUrl: orderItem.item.downloadUrl,
            yearlyPrice: orderItem.item.yearlyPrice,
            lifetimePrice: orderItem.item.lifetimePrice,
            currency: orderItem.item.currency, // ✅ Item's native currency
            category: orderItem.item.category,
          },
        })),
      })),
    });
  } catch (error) {
    console.error("[ORDERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}