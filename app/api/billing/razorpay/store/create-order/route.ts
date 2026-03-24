import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

import { convertCurrency } from "@/lib/payment/payment.utils";
import { createRazorpayOrder } from "@/lib/payment/createRazorpayOrder";
import { validateCoupon } from "@/lib/payment/coupons/coupons.service";
import { calculatePayment } from "@/lib/payment/pricingService";
import { Prisma } from "@prisma/client";
import { assignJp, deductJp } from "@/lib/utils/jp";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";

type Currency = "INR" | "USD";

interface StoreItem {
  itemId: string;
  quantity: number;
}

interface CreateStoreOrderRequest {
  items: StoreItem[];
  currency: Currency;
  couponCode?: string;
  exchangeRate?: number;
}
type OrderItemData = {
  itemId: string;
  quantity: number;
  priceAtPurchase: number;
  originalPrice: number;
  originalCurrency: string;
};

export async function POST(req: NextRequest) {
  try {
    const session = await checkRole("USER");

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const {
      items,
      couponCode,
      currency: selectedCurrency,
      exchangeRate,
    }: CreateStoreOrderRequest = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Items required" },
        { status: 400 },
      );
    }

    const productIds = [...new Set(items.map((i) => i.itemId))];

    const products = await prisma.item.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        basePrice: true,
        currency: true,
        createdByUserId: true,
      },
    });
    const hasGPItems = products.some((p) => p.currency === "GP");
    const hasJPItems = products.some((p) => p.currency === "JP");
    const hasRegularItems = products.some(
      (p) => p.currency !== "GP" && p.currency !== "JP",
    );

    if (hasGPItems && hasJPItems) {
      return NextResponse.json(
        { success: false, error: "Cannot purchase GP and JP items together" },
        { status: 400 },
      );
    }
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: "Some products not found" },
        { status: 400 },
      );
    }

    if ((hasGPItems || hasJPItems) && !hasRegularItems) {
      return handleWalletTransaction({
        userId: session.user.id,
        items,
        products,
        couponCode,
      });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let amount = 0;

    for (const item of items) {
      const product = productMap.get(item.itemId);
      if (!product) continue;

      let price = product.basePrice ?? 0;

      if (product.currency !== selectedCurrency) {
        // Use the client-provided rate if available, otherwise fall back to API
        if (
          exchangeRate &&
          product.currency === "USD" &&
          selectedCurrency === "INR"
        ) {
          price = Math.round(price * exchangeRate * 100) / 100;
        } else if (
          exchangeRate &&
          product.currency === "INR" &&
          selectedCurrency === "USD"
        ) {
          price = Math.round((price / exchangeRate) * 100) / 100;
        } else {
          price = await convertCurrency(
            price,
            product.currency as Currency,
            selectedCurrency,
          );
        }
      }

      amount += price * item.quantity;
    }

    let billing = await prisma.userBillingInformation.findFirst({
      where: { userId: session.user.id },
      select: { id: true, country: true },
    });

    if (!billing) {
      billing = await prisma.billingInformation.findFirst({
        where: { userId: session.user.id },
        select: { id: true, country: true },
      });
      if (!billing) {
        return NextResponse.json(
          { success: false, error: "Billing address not found" },
          { status: 400 },
        );
      }
    }

    const finalCurrency: Currency = selectedCurrency;
    const finalAmount = amount;

    let coupon = null;

    if (couponCode) {
      for (const product of products) {
        const validCoupon = await validateCoupon({
          couponCode,
          scope: "STORE_PRODUCT",
          entityId: product.id,
        });

        if (validCoupon) {
          coupon = validCoupon;
          break; // coupon valid for at least one product
        }
      }

      if (!coupon) {
        return NextResponse.json(
          {
            success: false,
            error: "Coupon not applicable to selected products",
          },
          { status: 400 },
        );
      }
    }

    const isIndia = billing.country === "IN";

    /* -------------------------------- */

    const { discount, totalAmount, gst } = calculatePayment({
      baseAmount: finalAmount,
      coupon,
      currency: finalCurrency,
      isIndia,
    });
    const roundedTotal = Number(totalAmount.toFixed(2));

    const { order, key } = await createRazorpayOrder(
      roundedTotal,
      finalCurrency,
    );

    /* -------------------------------- */
    /* 8️⃣ CREATE PAYMENT ORDER          */
    /* -------------------------------- */

    await prisma.paymentOrder.create({
      data: {
        userId: session.user.id,
        contextType: "STORE_PRODUCT",

        razorpayOrderId: order.id,
        orderId: order.id,

        baseAmount: finalAmount,
        gstAmount: gst,
        discountApplied: discount,
        totalAmount: roundedTotal,

        currency: finalCurrency,
        status: "PENDING",

        couponId: coupon?.id ?? null,
        billingInfoId: billing.id,
        cartSnapshot: items as unknown as Prisma.InputJsonValue,

        // for store purchase → no challenge/program
        challengeId: null,
        programId: null,

        // IMP: leave storeOrderId null
        storeOrderId: null,
      },
    });

    return NextResponse.json({
      success: true,
      key,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Store Payment Error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to create order" },
      { status: 500 },
    );
  }
}

interface HandleWalletTransactionParams {
  userId: string;
  items: StoreItem[];
  products: {
    id: string;
    name: string;
    basePrice: number;
    currency: string;
    createdByUserId: string | null;
  }[];
  couponCode?: string | null;
}

async function handleWalletTransaction({
  userId,
  items,
  products,
  couponCode,
}: HandleWalletTransactionParams) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { plan: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let coupon = null;

  if (couponCode) {
    coupon = await prisma.coupon.findUnique({
      where: { couponCode: couponCode.toUpperCase() },
      include: {
        applicableStoreProducts: { select: { id: true } },
      },
    });
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  let walletTotal = 0;

  const orderItemsData: OrderItemData[] = [];

  if (couponCode) {
    coupon = await prisma.coupon.findUnique({
      where: { couponCode: couponCode.toUpperCase() },
      include: {
        applicableStoreProducts: { select: { id: true } },
      },
    });
  }

  for (const item of items) {
    const product = productMap.get(item.itemId);
    if (!product) continue;

    let finalPrice = product.basePrice;

    // Apply coupon
    if (coupon) {
      const allowedProductIds = coupon.applicableStoreProducts.map((p) => p.id);
      const isApplicable =
        allowedProductIds.length === 0 ||
        allowedProductIds.includes(product.id);

      if (isApplicable) {
        let discount = 0;

        if (coupon.type === "PERCENTAGE" && coupon.discountPercentage) {
          discount = (finalPrice * coupon.discountPercentage) / 100;
        }

        if (coupon.type === "FIXED" && coupon.discountAmountGP) {
          discount = coupon.discountAmountGP;
        }

        if (coupon.type === "FULL_DISCOUNT") {
          discount = finalPrice;
        }

        finalPrice = Math.max(finalPrice - discount, 0);
      }
    }

    walletTotal += finalPrice * item.quantity;

    orderItemsData.push({
      itemId: product.id,
      quantity: item.quantity,
      priceAtPurchase: finalPrice,
      originalPrice: product.basePrice,
      originalCurrency: product.currency,
    });
  }
  if (user.jpBalance < walletTotal) {
    return NextResponse.json(
      {
        error: `Insufficient balance. Need ${walletTotal} and you have ${user.jpBalance}`,
      },
      { status: 400 },
    );
  }

  const creatorRewards: Record<
    string,
    {
      amount: number;
      items: {
        itemId: string;
        name: string;
        quantity: number;
      }[];
    }
  > = {};
  for (const item of items) {
    const product = productMap.get(item.itemId);
    if (!product || !product.createdByUserId) continue;

    const creatorId = product.createdByUserId;
    const orderItem = orderItemsData.find((o) => o.itemId === item.itemId);
    const amount = (orderItem?.priceAtPurchase || 0) * item.quantity;

    if (!creatorRewards[creatorId]) {
      creatorRewards[creatorId] = {
        amount: 0,
        items: [],
      };
    }

    creatorRewards[creatorId].amount += amount;

    creatorRewards[creatorId].items.push({
      itemId: item.itemId,
      name: product.name,
      quantity: item.quantity,
    });
  }
  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        userId: user.id,
        totalAmount: walletTotal,
        currency: products[0].currency,
        status: "COMPLETED",
        items: {
          create: orderItemsData,
        },
      },
    });
    // Create coupon redemption record
    if (coupon) {
      const totalDiscount = orderItemsData.reduce(
        (sum, item) =>
          sum + (item.originalPrice - item.priceAtPurchase) * item.quantity,
        0,
      );

      await tx.couponRedemption.create({
        data: {
          couponId: coupon.id,
          userId: user.id,
          redeemed: true,
          appliedPlan: "STORE_PRODUCT",
          discountApplied: totalDiscount,
        },
      });
    }

    await deductJp(user, "STORE_PURCHASE", tx, {
      amount: walletTotal,

      metadata: {
        orderId: createdOrder.id,
        items: items.map((i) => {
          const product = productMap.get(i.itemId);

          return {
            name: product?.name ?? "Unknown Product",
            itemId: i.itemId,
          };
        }),
      },
    });
    await tx.cart.deleteMany({
      where: {
        userId: user.id,
        itemId: { in: items.map((i) => i.itemId) },
      },
    });

    for (const [creatorId, reward] of Object.entries(creatorRewards)) {
      const creator = await tx.user.findUnique({
        where: { id: creatorId },
        include: { plan: true },
      });

      if (!creator) continue;

      await assignJp(creator, "STORE_SALE", tx, {
        amount: reward.amount,
        metadata: {
          buyerId: user.id,
          orderId: createdOrder.id,
          items: reward.items,
        },
      });
    }

    return createdOrder;
  });
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const itemNames = items
    .map((i) => {
      const product = productMap.get(i.itemId)!;
      return `${product.name ?? product.id} (×${i.quantity}) - ${product.basePrice} ${product.currency}`;
    })
    .join(", ");

  const appUrl = process.env.NEXT_URL || "";
  void sendEmailUsingTemplate({
    toEmail: user.email!,
    toName: user.name ?? "Customer",
    templateId: "order-placed",
    templateData: {
      username: user.name ?? "Customer",
      orderId: order.id,
      orderDate,
      totalAmount: `${walletTotal} ${products[0].currency}`,
      status: "COMPLETED",
      itemCount: items.length,
      itemNames,
      orderUrl: `${appUrl}/dashboard/store/profile`,
      currency: products[0].currency,
      paymentDetails: `Paid entirely with ${products[0].currency} from your balance`,
    },
  });

  return NextResponse.json({
    success: true,
    type: "WALLET",
    order,
  });
}
