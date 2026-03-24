// app/api/user/store/items/place-order/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { getServerSession } from "next-auth";
import { sendEmailUsingTemplate } from "utils/sendEmail";
import { deductJp } from "@/lib/utils/jp";

// ✅ TypeScript interfaces
interface OrderItemInput {
  itemId: string;
  quantity: number;
}

interface ItemDetail {
  name: string;
  currency: string;
  price: number;
  originalPrice: number;
  originalCurrency: string;
}

const CONVERSION_RATES: Record<string, Record<string, number>> = {
  USD: { INR: 83.5, USD: 1 },
  INR: { USD: 1 / 83.5, INR: 1 },
  GP: { GP: 1 },
  JP: { JP: 1 },
};

const convertPrice = (amount: number, from: string, to: string): number => {
  if (from === to) return amount;
  if (from === "GP" || to === "GP") {
    throw new Error("GP items cannot be converted to other currencies");
  }
  if (from === "JP" || to === "JP") {
    throw new Error("JP items cannot be converted to other currencies");
  }
  return amount * (CONVERSION_RATES[from]?.[to] ?? 1);
};

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    GP: "GP",
    JP: "JP",
  };
  return symbols[currency] ?? currency;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { items, currency, couponCode } = body as {
      items: OrderItemInput[];
      currency: string;
      couponCode?: string;
    };

    if (!items || items.length === 0) {
      return new NextResponse("Items are required", { status: 400 });
    }

    if (!currency) {
      return new NextResponse("Currency is required", { status: 400 });
    }

    // ✅ FIXED: Get user with plan relationship for deductJp compatibility
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        plan: true,
      },
      omit: {
        password: true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const itemIds = items.map((i) => i.itemId);
    const dbItems = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: {
        id: true,
        name: true,
        currency: true,
        basePrice: true,
        monthlyPrice: true,
        yearlyPrice: true,
        lifetimePrice: true,
      },
    });
    let coupon = null;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { couponCode: couponCode.toUpperCase() },
        include: {
          applicableStoreProducts: { select: { id: true } },
        },
      });

      if (!coupon) {
        return new NextResponse("Invalid coupon code", { status: 400 });
      }

      // Check date validity
      const now = new Date();
      if (now < coupon.startDate || now > coupon.endDate) {
        return new NextResponse("Coupon expired", { status: 400 });
      }

      // Check scope
      if (coupon.scope !== "STORE_PRODUCT") {
        return new NextResponse("Coupon not valid for store products", {
          status: 400,
        });
      }
    }
    // ✅ FIXED: Separate items by currency type - removed unused variables
    const regularItems = dbItems.filter(
      (item) => item.currency !== "GP" && item.currency !== "JP",
    );

    const hasGPItems = dbItems.some((item) => item.currency === "GP");
    const hasJPItems = dbItems.some((item) => item.currency === "JP");
    const hasRegularItems = regularItems.length > 0;

    // ✅ Validation: Cannot mix GP and JP
    if (hasGPItems && hasJPItems) {
      return new NextResponse(
        "Cannot purchase GP and JP items together. Please checkout separately.",
        { status: 400 },
      );
    }

    // ✅ Determine points type
    const pointsType = hasGPItems ? "GP" : hasJPItems ? "JP" : null;

    // ✅ Validate currency for hybrid or single-currency orders
    if (currency === "MIXED") {
      // Hybrid payment - must have both points and regular items
      if (!pointsType || !hasRegularItems) {
        return new NextResponse(
          "Mixed payment requires both points items and regular items",
          { status: 400 },
        );
      }
    } else if (currency === "GP" || currency === "JP") {
      // Pure points payment - cannot have regular items
      if (hasRegularItems) {
        return new NextResponse(
          `${currency} can only be used for ${currency} items`,
          { status: 400 },
        );
      }
    } else if (!["INR", "USD"].includes(currency)) {
      return new NextResponse("Invalid currency", { status: 400 });
    }

    // ✅ Calculate totals
    let pointsTotal = 0;
    let regularTotal = 0;
    let totalDiscount = 0;

    const orderItemsData: {
      itemId: string;
      quantity: number;
      priceAtPurchase: number;
      originalPrice: number;
      originalCurrency: string;
    }[] = [];

    const itemDetails: ItemDetail[] = [];

    for (const { itemId, quantity } of items) {
      if (!itemId) {
        return new NextResponse("Item ID is required", { status: 400 });
      }
      if (!quantity || quantity < 1) {
        return new NextResponse("Valid quantity is required", { status: 400 });
      }

      const item = dbItems.find((i) => i.id === itemId);
      if (!item) {
        return new NextResponse(`Item ${itemId} not found`, { status: 404 });
      }

      // Calculate price based on membership
      let finalPrice = item.basePrice;

      // Apply coupon if exists
      if (coupon) {
        const allowedProductIds = coupon.applicableStoreProducts.map(
          (p) => p.id,
        );

        const isApplicable =
          allowedProductIds.length === 0 || allowedProductIds.includes(item.id);

        if (isApplicable) {
          let discount = 0;

          if (coupon.type === "PERCENTAGE" && coupon.discountPercentage) {
            discount = (finalPrice * coupon.discountPercentage) / 100;
          }

          if (coupon.type === "FIXED") {
            if (item.currency === "USD" && coupon.discountAmountUSD) {
              discount = coupon.discountAmountUSD;
            }

            if (item.currency === "INR" && coupon.discountAmountINR) {
              discount = coupon.discountAmountINR;
            }

            if (item.currency === "GP" && coupon.discountAmountGP) {
              discount = coupon.discountAmountGP;
            }
          }

          if (coupon.type === "FULL_DISCOUNT") {
            discount = finalPrice;
          }

          finalPrice = Math.max(finalPrice - discount, 0);
          totalDiscount += discount * quantity;
        }
      }
      const itemCurrency = item.currency || "INR";
      const originalPrice = finalPrice;

      // Handle points items (GP or JP)
      if (itemCurrency === "GP" || itemCurrency === "JP") {
        pointsTotal += finalPrice * quantity;
        orderItemsData.push({
          itemId: item.id,
          quantity,
          priceAtPurchase: finalPrice,
          originalPrice: finalPrice,
          originalCurrency: itemCurrency,
        });
        itemDetails.push({
          name: item.name,
          currency: itemCurrency,
          price: finalPrice,
          originalPrice: finalPrice,
          originalCurrency: itemCurrency,
        });
      } else {
        // Handle regular currency items
        const targetCurrency = currency === "MIXED" ? "INR" : currency;
        const convertedPrice = convertPrice(
          finalPrice,
          itemCurrency,
          targetCurrency,
        );
        regularTotal += convertedPrice * quantity;

        orderItemsData.push({
          itemId: item.id,
          quantity,
          priceAtPurchase: convertedPrice,
          originalPrice,
          originalCurrency: itemCurrency,
        });
        itemDetails.push({
          name: item.name,
          currency: itemCurrency,
          price: convertedPrice,
          originalPrice,
          originalCurrency: itemCurrency,
        });
      }
    }

    // ✅ Check if user has enough points (if points items exist)
    if (pointsTotal > 0 && user.jpBalance < pointsTotal) {
      return new NextResponse(
        `Insufficient ${pointsType} balance. You have ${user.jpBalance} ${pointsType} but need ${Math.ceil(pointsTotal)} ${pointsType}.`,
        { status: 400 },
      );
    }

    // ✅ Determine final order currency and total
    let orderCurrency: string;
    let orderTotal: number;

    if (currency === "MIXED") {
      // Hybrid payment: store the regular currency total
      orderCurrency = "INR";
      orderTotal = regularTotal;
    } else if (currency === "GP" || currency === "JP") {
      // Pure points payment
      orderCurrency = currency;
      orderTotal = pointsTotal;
    } else {
      // Pure regular currency payment
      orderCurrency = currency;
      orderTotal = regularTotal;
    }

    // ✅ FIXED: Create order with transaction - user now has plan property
    const result = await prisma.$transaction(async (tx) => {
      // Deduct points if there are points items
      if (pointsTotal > 0 && pointsType) {
        // ✅ FIXED: Pass the full user object with plan relationship
        await deductJp(user, "STORE_PURCHASE", tx, { amount: pointsTotal });
      }

      // Create the order - ALL orders are COMPLETED for now (no payment gateway)
      const order = await tx.order.create({
        data: {
          userId: user.id,
          totalAmount: Math.ceil(orderTotal),
          currency: orderCurrency,
          status: "COMPLETED",
          items: { create: orderItemsData },
        },
        include: { items: { include: { item: true } } },
      });

      // Clear cart items
      await tx.cart.deleteMany({
        where: { userId: user.id, itemId: { in: itemIds } },
      });
      if (coupon) {
        await tx.couponRedemption.create({
          data: {
            couponId: coupon.id,
            userId: user.id,
            redeemed: true,
            appliedPlan: "STORE_PRODUCT",
            discountApplied: Math.ceil(totalDiscount),
          },
        });
      }
      return order;
    });

    // ✅ Send confirmation email
    try {
      const orderDate = new Date(result.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Build email content based on payment type
      let totalAmountStr: string;
      let paymentDetails: string;

      if (currency === "MIXED") {
        // Hybrid payment
        totalAmountStr = `${getCurrencySymbol(orderCurrency)}${regularTotal.toFixed(2)} + ${Math.ceil(pointsTotal)} ${pointsType}`;
        paymentDetails = `Payment split: ${Math.ceil(pointsTotal)} ${pointsType} deducted from balance, ${getCurrencySymbol(orderCurrency)}${regularTotal.toFixed(2)} paid via ${orderCurrency}`;
      } else if (currency === "GP" || currency === "JP") {
        // Pure points payment
        totalAmountStr = `${Math.ceil(pointsTotal)} ${currency}`;
        paymentDetails = `Paid entirely with ${currency} from your balance`;
      } else {
        // Pure regular currency payment
        totalAmountStr = `${getCurrencySymbol(orderCurrency)}${regularTotal.toFixed(2)}`;
        paymentDetails = `Paid in ${orderCurrency}`;
      }

      const itemNamesWithDetails = itemDetails
        .map((d: ItemDetail, i: number) => {
          const qty = orderItemsData[i].quantity;
          const itemCurrency = d.originalCurrency;

          if (itemCurrency === "GP" || itemCurrency === "JP") {
            return `${d.name} (×${qty}) - ${Math.ceil(d.price)} ${itemCurrency}`;
          }

          if (d.originalCurrency !== orderCurrency && currency !== "MIXED") {
            return `${d.name} (×${qty}) - ${getCurrencySymbol(d.originalCurrency)}${d.originalPrice.toFixed(2)} → ${getCurrencySymbol(orderCurrency)}${d.price.toFixed(2)}`;
          }

          return `${d.name} (×${qty}) - ${getCurrencySymbol(orderCurrency)}${d.price.toFixed(2)}`;
        })
        .join(", ");

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

      void sendEmailUsingTemplate({
        toEmail: user.email!,
        toName: user.name ?? "Customer",
        templateId: "order-placed",
        templateData: {
          username: user.name ?? "Customer",
          orderId: result.id,
          orderDate,
          totalAmount: totalAmountStr,
          status: "COMPLETED",
          itemCount: orderItemsData.length,
          itemNames: itemNamesWithDetails,
          orderUrl: `${appUrl}/dashboard/store/profile`,
          currency: orderCurrency,
          paymentDetails,
        },
      });

      console.log("\n[ORDER_EMAIL_SENT] ✅ Email sent successfully!");
      console.log(`  → Order ID: ${result.id}`);
      console.log(
        `  → Payment Type: ${currency === "MIXED" ? "Hybrid" : currency}`,
      );
      if (pointsTotal > 0) {
        console.log(`  → ${pointsType} Deducted: ${Math.ceil(pointsTotal)}`);
      }
      if (regularTotal > 0) {
        console.log(
          `  → ${orderCurrency} Amount: ${getCurrencySymbol(orderCurrency)}${regularTotal.toFixed(2)}`,
        );
      }
    } catch (emailError) {
      console.error("[ORDER_EMAIL_FAILED] ❌", emailError);
    }

    // ✅ Return order details
    return NextResponse.json({
      order: {
        id: result.id,
        totalAmount: result.totalAmount,
        currency: result.currency,
        status: "COMPLETED",
        createdAt: result.createdAt,
        pointsDeducted: pointsTotal > 0 ? Math.ceil(pointsTotal) : null,
        pointsType: pointsType,
        regularAmount: regularTotal > 0 ? regularTotal : null,
        items: result.items.map((orderItem) => ({
          id: orderItem.id,
          quantity: orderItem.quantity,
          priceAtPurchase: orderItem.priceAtPurchase,
          originalPrice: orderItem.originalPrice,
          originalCurrency: orderItem.originalCurrency,
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

    const errorMessage =
      error instanceof Error ? error.message : "Internal Error";

    if (
      errorMessage.includes("GP items cannot be converted") ||
      errorMessage.includes("JP items cannot be converted") ||
      errorMessage.includes("Insufficient")
    ) {
      return new NextResponse(errorMessage, { status: 400 });
    }

    return new NextResponse("Internal Error", { status: 500 });
  }
}
