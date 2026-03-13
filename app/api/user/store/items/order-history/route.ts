// import { prisma } from '@/lib/prisma';
// import { authOptions } from "@/lib/auth";
// import { getServerSession } from "next-auth";
// import { NextResponse } from "next/server";

// export async function GET() {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session || !session.user?.id) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const userId = session.user.id;

//     const orders = await prisma.order.findMany({
//       where: {
//         userId: userId,
//       },
//       include: {
//         items: {
//           include: {
//             item: {
//               include: {
//                 category: true,
//               },
//             },
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         orders,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error fetching order history:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch order history" },
//       { status: 500 }
//     );
//   }
// }


import { prisma } from '@/lib/prisma';
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // ✅ Fetch orders with all currency-related fields
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },
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

    // ✅ Transform orders to include currency information
    const ordersWithCurrency = orders.map(order => ({
      ...order,
      currency: order.currency || "INR", // Default to INR if not set
      items: order.items.map(orderItem => ({
        ...orderItem,
        // Ensure originalPrice and originalCurrency are included
        originalPrice: orderItem.originalPrice || orderItem.priceAtPurchase,
        originalCurrency: orderItem.originalCurrency || order.currency || "INR",
      })),
    }));

    return NextResponse.json(
      {
        success: true,
        orders: ordersWithCurrency,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching order history:", error);
    return NextResponse.json(
      { error: "Failed to fetch order history" },
      { status: 500 }
    );
  }
}