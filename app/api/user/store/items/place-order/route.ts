// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
// import { getServerSession } from "next-auth";

// export async function POST(req: Request) {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     const body = await req.json();
//     const { itemId, quantity } = body;

//     if (!itemId) {
//       return new NextResponse("Item ID is required", { status: 400 });
//     }

//     if (!quantity || quantity < 1) {
//       return new NextResponse("Valid quantity is required", { status: 400 });
//     }

//     // Get the item to verify it exists and get its price
//     const item = await prisma.item.findUnique({
//       where: {
//         id: itemId,
//       },
//     });

//     if (!item) {
//       return new NextResponse("Item not found", { status: 404 });
//     }

//     // Get user's membership status to calculate correct price
//     const user = await prisma.user.findUnique({
//       where: {
//         id: session?.user.id,
//       },
//       select: {
//         id: true,
//         membership: true,
//       },
//     });

//     if (!user) {
//       return new NextResponse("User not found", { status: 404 });
//     }

//     // Calculate price based on membership
//     let finalPrice = item.basePrice;
//     switch (user.membership) {
//       case "MONTHLY":
//         finalPrice = item.monthlyPrice ?? item.basePrice;
//         break;
//       case "YEARLY":
//         finalPrice = item.yearlyPrice ?? item.basePrice;
//         break;
//       case "LIFETIME":
//         finalPrice = item.lifetimePrice ?? item.basePrice;
//         break;
//     }

//     // Create the order
//     const order = await prisma.order.create({
//       data: {
//         userId: user.id,
//         items: {
//           create: {
//             itemId: item.id,
//             quantity: quantity,
//             priceAtPurchase: finalPrice,
//           },
//         },
//         totalAmount: finalPrice * quantity,
//         status: "PENDING", // Initial status
//       },
//       include: {
//         items: {
//           include: {
//             item: true,
//           },
//         },
//       },
//     });

//     return NextResponse.json({
//       order: {
//         id: order.id,
//         totalAmount: order.totalAmount,
//         status: order.status,
//         createdAt: order.createdAt,
//         items: order.items.map((orderItem) => ({
//           id: orderItem.id,
//           quantity: orderItem.quantity,
//           priceAtPurchase: orderItem.priceAtPurchase,
//           item: {
//             id: orderItem.item.id,
//             name: orderItem.item.name,
//             imageUrl: orderItem.item.imageUrl,
//           },
//         })),
//       },
//     });
//   } catch (error) {
//     console.error("[ORDER_CREATE]", error);
//     return new NextResponse("Internal Error", { status: 500 });
//   }
// } 



import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { items } = body as { items: { itemId: string; quantity: number }[] };

    if (!items || items.length === 0) {
      return new NextResponse("Items are required", { status: 400 });
    }

    // Get user with membership info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, membership: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Build order items and calculate total
    let totalAmount = 0;
    const orderItemsData: {
      itemId: string;
      quantity: number;
      priceAtPurchase: number;
    }[] = [];

    for (const { itemId, quantity } of items) {
      if (!itemId) {
        return new NextResponse("Item ID is required", { status: 400 });
      }
      if (!quantity || quantity < 1) {
        return new NextResponse("Valid quantity is required", { status: 400 });
      }

      const item = await prisma.item.findUnique({ where: { id: itemId } });

      if (!item) {
        return new NextResponse(`Item ${itemId} not found`, { status: 404 });
      }

      // Calculate price based on membership
      let finalPrice = item.basePrice;
      switch (user.membership) {
        case "MONTHLY":
          finalPrice = item.monthlyPrice ?? item.basePrice;
          break;
        case "YEARLY":
          finalPrice = item.yearlyPrice ?? item.basePrice;
          break;
        case "LIFETIME":
          finalPrice = item.lifetimePrice ?? item.basePrice;
          break;
      }

      totalAmount += finalPrice * quantity;
      orderItemsData.push({ itemId: item.id, quantity, priceAtPurchase: finalPrice });
    }

    // Create order with all items in one transaction
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        totalAmount,
        status: "PENDING",
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    return NextResponse.json({
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map((orderItem) => ({
          id: orderItem.id,
          quantity: orderItem.quantity,
          priceAtPurchase: orderItem.priceAtPurchase,
          item: {
            id: orderItem.item.id,
            name: orderItem.item.name,
            imageUrl: orderItem.item.imageUrl,
          },
        })),
      },
    });
  } catch (error) {
    console.error("[ORDER_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}