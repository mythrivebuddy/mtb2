
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
// import { getServerSession } from "next-auth";
// import { sendEmailUsingTemplate } from "utils/sendEmail"; // ✅ adjust path if needed

// export async function POST(req: Request) {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     const body = await req.json();
//     const { items } = body as { items: { itemId: string; quantity: number }[] };

//     if (!items || items.length === 0) {
//       return new NextResponse("Items are required", { status: 400 });
//     }

//     // Get user with membership info
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id },
//       select: { id: true, membership: true, email: true, name: true },
//     });

//     if (!user) {
//       return new NextResponse("User not found", { status: 404 });
//     }

//     // Build order items and calculate total
//     let totalAmount = 0;
//     const orderItemsData: {
//       itemId: string;
//       quantity: number;
//       priceAtPurchase: number;
//     }[] = [];

//     // ✅ Also collect item names + currencies for the email
//     const itemDetails: { name: string; currency: string; price: number }[] = [];

//     for (const { itemId, quantity } of items) {
//       if (!itemId) {
//         return new NextResponse("Item ID is required", { status: 400 });
//       }
//       if (!quantity || quantity < 1) {
//         return new NextResponse("Valid quantity is required", { status: 400 });
//       }

//       const item = await prisma.item.findUnique({ where: { id: itemId } });

//       if (!item) {
//         return new NextResponse(`Item ${itemId} not found`, { status: 404 });
//       }

//       // Calculate price based on membership
//       let finalPrice = item.basePrice;
//       switch (user.membership) {
//         case "MONTHLY":
//           finalPrice = item.monthlyPrice ?? item.basePrice;
//           break;
//         case "YEARLY":
//           finalPrice = item.yearlyPrice ?? item.basePrice;
//           break;
//         case "LIFETIME":
//           finalPrice = item.lifetimePrice ?? item.basePrice;
//           break;
//       }

//       totalAmount += finalPrice * quantity;
//       orderItemsData.push({ itemId: item.id, quantity, priceAtPurchase: finalPrice });
//       itemDetails.push({ name: item.name, currency: item.currency || "INR", price: finalPrice });
//     }

//     // ✅ Create order + clear cart in one transaction
//     const [order] = await prisma.$transaction([
//       prisma.order.create({
//         data: {
//           userId: user.id,
//           totalAmount,
//           status: "COMPLETED",
//           items: {
//             create: orderItemsData,
//           },
//         },
//         include: {
//           items: {
//             include: { item: true },
//           },
//         },
//       }),
//       prisma.cart.deleteMany({
//         where: { userId: user.id },
//       }),
//     ]);

//     // ✅ Send order confirmation email (non-blocking — won't fail the order if email errors)
//     try {
//       const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
//         day: "numeric",
//         month: "long",
//         year: "numeric",
//       });

//       // Build a readable total amount string
//       // Group by currency since mixed carts are possible
//       const currencyTotals: Record<string, number> = {};
//       itemDetails.forEach((d, i) => {
//         const cur = d.currency;
//         const amt = d.price * orderItemsData[i].quantity;
//         currencyTotals[cur] = (currencyTotals[cur] || 0) + amt;
//       });
//       const totalAmountStr = Object.entries(currencyTotals)
//         .map(([cur, amt]) => `${cur === "INR" ? "₹" : "$"}${Number(amt).toFixed(2)}`)
//         .join(" + ");

//       const itemNames = itemDetails.map((d) => d.name).join(", ");
//       const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

//       await sendEmailUsingTemplate({
//         toEmail: user.email!,
//         toName: user.name ?? "Customer",
//         templateId: "order-placed",
//         templateData: {
//           username: user.name ?? "Customer",
//           orderId: order.id,
//           orderDate,
//           totalAmount: totalAmountStr,
//           status: order.status,
//           itemCount: orderItemsData.length,
//           itemNames,
//           orderUrl: `${appUrl}/dashboard/store/profile`,
//         },
//       });

//       // ✅ Success log
//       console.log("\n[ORDER_EMAIL_SENT] ✅ Email sent successfully!");
//       console.log(`  → To:       ${user.email}`);
//       console.log(`  → Name:     ${user.name ?? "Customer"}`);
//       console.log(`  → Order ID: ${order.id}`);
//       console.log(`  → Amount:   ${totalAmountStr}`);
//       console.log(`  → Items:    ${itemNames}\n`);

//     } catch (emailError) {
//       // Log but don't fail the request — order is already placed
//       console.error("[ORDER_EMAIL_FAILED] ❌", emailError);
//     }

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
import { sendEmailUsingTemplate } from "utils/sendEmail";

// ✅ Conversion rates (same as frontend)
const CONVERSION_RATES: Record<string, Record<string, number>> = {
  USD: { INR: 83.5, USD: 1 },
  INR: { USD: 1 / 83.5, INR: 1 },
};

const convertPrice = (amount: number, from: string, to: string): number => {
  if (from === to) return amount;
  return amount * (CONVERSION_RATES[from]?.[to] ?? 1);
};

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = { INR: "₹", USD: "$" };
  return symbols[currency] ?? currency;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { items, currency } = body as {
      items: { itemId: string; quantity: number }[];
      currency: string; // ✅ Required selected currency (INR or USD)
    };

    if (!items || items.length === 0) {
      return new NextResponse("Items are required", { status: 400 });
    }

    if (!currency) {
      return new NextResponse("Currency is required", { status: 400 });
    }

    // Get user with membership info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, membership: true, email: true, name: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // ✅ Build order items with currency conversion
    let totalAmount = 0;
    const orderItemsData: {
      itemId: string;
      quantity: number;
      priceAtPurchase: number;
      originalPrice: number;
      originalCurrency: string;
    }[] = [];

    // Collect item details for email
    const itemDetails: {
      name: string;
      currency: string;
      price: number;
      originalPrice: number;
      originalCurrency: string;
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

      const itemCurrency = item.currency || "INR";
      const originalPrice = finalPrice;

      // ✅ Convert price to selected order currency
      const convertedPrice = convertPrice(finalPrice, itemCurrency, currency);

      totalAmount += convertedPrice * quantity;

      orderItemsData.push({
        itemId: item.id,
        quantity,
        priceAtPurchase: convertedPrice, // ✅ Price in order currency
        originalPrice, // ✅ Store original price
        originalCurrency: itemCurrency, // ✅ Store original currency
      });

      itemDetails.push({
        name: item.name,
        currency: itemCurrency,
        price: convertedPrice,
        originalPrice,
        originalCurrency: itemCurrency,
      });
    }

    // ✅ Create order with currency field
    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          userId: user.id,
          totalAmount,
          currency, // ✅ Store selected order currency
          status: "COMPLETED",
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: { item: true },
          },
        },
      }),
      prisma.cart.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    // ✅ Send order confirmation email
    try {
      const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Build total amount string
      const totalAmountStr = `${getCurrencySymbol(currency)}${Number(totalAmount).toFixed(2)}`;

      // Build item details with conversion info
      const itemNamesWithDetails = itemDetails
        .map((d, i) => {
          const item = d.name;
          const qty = orderItemsData[i].quantity;
          if (d.originalCurrency !== currency) {
            return `${item} (×${qty}) - ${getCurrencySymbol(d.originalCurrency)}${d.originalPrice.toFixed(2)} → ${getCurrencySymbol(currency)}${d.price.toFixed(2)}`;
          }
          return `${item} (×${qty}) - ${getCurrencySymbol(currency)}${d.price.toFixed(2)}`;
        })
        .join(", ");

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

      await sendEmailUsingTemplate({
        toEmail: user.email!,
        toName: user.name ?? "Customer",
        templateId: "order-placed",
        templateData: {
          username: user.name ?? "Customer",
          orderId: order.id,
          orderDate,
          totalAmount: totalAmountStr,
          status: order.status,
          itemCount: orderItemsData.length,
          itemNames: itemNamesWithDetails,
          orderUrl: `${appUrl}/dashboard/store/profile`,
          currency, // ✅ Include currency in email
        },
      });

      console.log("\n[ORDER_EMAIL_SENT] ✅ Email sent successfully!");
      console.log(`  → To:       ${user.email}`);
      console.log(`  → Name:     ${user.name ?? "Customer"}`);
      console.log(`  → Order ID: ${order.id}`);
      console.log(`  → Currency: ${currency}`);
      console.log(`  → Amount:   ${totalAmountStr}`);
      console.log(`  → Items:    ${itemNamesWithDetails}\n`);
    } catch (emailError) {
      console.error("[ORDER_EMAIL_FAILED] ❌", emailError);
    }

    return NextResponse.json({
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        currency: order.currency, // ✅ Return currency in response
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map((orderItem) => ({
          id: orderItem.id,
          quantity: orderItem.quantity,
          priceAtPurchase: orderItem.priceAtPurchase,
          originalPrice: orderItem.originalPrice, // ✅ Return original price
          originalCurrency: orderItem.originalCurrency, // ✅ Return original currency
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