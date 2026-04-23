import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

import { convertCurrency } from "@/lib/payment/payment.utils";
import { createRazorpayOrder } from "@/lib/payment/createRazorpayOrder";
import { assignJp, deductJp } from "@/lib/utils/jp";
import { inngest } from "@/lib/inngest";

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
    const body = await req.json();
    const {
      couponCode,
      currency: selectedCurrency,
      exchangeRate,
    }: CreateStoreOrderRequest = body;

    let { items }: CreateStoreOrderRequest = body;

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

    // Pure wallet cart
    if ((hasGPItems || hasJPItems) && !hasRegularItems) {
      return handleWalletTransaction({
        userId: session.user.id,
        items,
        products,
        couponCode,
      });
    }

    // Mixed cart — split and process GP via wallet first, then money via Razorpay
    if (hasGPItems && hasRegularItems) {
      const gpItems = items.filter((i) => {
        const p = products.find((p) => p.id === i.itemId);
        return p?.currency === "GP";
      });
      const gpProducts = products.filter((p) => p.currency === "GP");

      const walletResult = await handleWalletTransaction({
        userId: session.user.id,
        items: gpItems,
        products: gpProducts,
        couponCode,
      });

      // If GP transaction failed, stop
      const walletData = await (walletResult as Response).json();
      if (!walletData.success) {
        return NextResponse.json(
          { success: false, error: walletData.error || "GP payment failed" },
          { status: 400 },
        );
      }

      // Continue with only money items below
      items = items.filter((i) => {
        const p = products.find((p) => p.id === i.itemId);
        return p?.currency !== "GP";
      });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let cartTotal = 0;
    let applicableTotal = 0;

    let applicableItemIds: string[] = [];

    let coupon = null;

    if (couponCode) {
      const moneyItemIds = items.map((i) => i.itemId); // items is already filtered to money-only at this point
      const verifyData = await verifyStoreCoupon({
        code: couponCode,
        currency: selectedCurrency,
        storeItemIds: moneyItemIds,
        userId: session.user.id,
      });

      if (!verifyData.valid) {
        return NextResponse.json(
          { success: false, error: verifyData.message },
          { status: 400 },
        );
      }

      coupon = verifyData.coupon;
      applicableItemIds = verifyData.applicableItemIds || [];
    }

    for (const item of items) {
      const product = productMap.get(item.itemId);
      if (!product) continue;

      let price = product.basePrice ?? 0;

      if (product.currency !== selectedCurrency) {
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
            selectedCurrency as Currency,
          );
        }
      }

      const total = price * item.quantity;

      cartTotal += total;

      if (applicableItemIds.includes(product.id)) {
        applicableTotal += total;
      }
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
    // const finalAmount = cartTotal;

    const isIndia = billing.country === "IN";

    /* -------------------------------- */

    let discount = 0;

    if (coupon) {
      if (coupon.type === "PERCENTAGE") {
        discount = (applicableTotal * (coupon.discountPercentage || 0)) / 100;
      }

      if (coupon.type === "FIXED") {
        if (selectedCurrency === "USD")
          discount = coupon.discountAmountUSD || 0;
        if (selectedCurrency === "INR")
          discount = coupon.discountAmountINR || 0;
      }

      if (coupon.type === "FULL_DISCOUNT") {
        discount = applicableTotal;
      }
    }

    const discountedTotal = Math.max(cartTotal - discount, 0);

    const gst = isIndia ? discountedTotal * 0.18 : 0;

    const totalAmount = discountedTotal + gst;
    const roundedTotal = Math.max(Number(totalAmount.toFixed(2)), 1);

    const { order, key } = await createRazorpayOrder(
      roundedTotal,
      finalCurrency,
    );

    const snapshotItems = [];

    let remainingDiscount = discount;

    for (const item of items) {
      const product = productMap.get(item.itemId);
      if (!product) continue;

      let price = product.basePrice ?? 0;

      // currency conversion (same as your logic)
      if (product.currency !== selectedCurrency) {
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
            selectedCurrency as Currency,
          );
        }
      }

      const itemTotal = price * item.quantity;

      let discountForItem = 0;

      if (coupon && applicableItemIds.includes(product.id)) {
        if (coupon.type === "FULL_DISCOUNT") {
          discountForItem = itemTotal;
        } else if (coupon.type === "PERCENTAGE") {
          discountForItem =
            (itemTotal * (coupon.discountPercentage ?? 0)) / 100;
        } else if (coupon.type === "FIXED") {
          discountForItem = Math.min(itemTotal, remainingDiscount);
          remainingDiscount -= discountForItem;
        }
      }

      const itemDiscountedTotal = itemTotal - discountForItem;

      // distribute GST proportionally
      const itemGst =
        discountedTotal > 0 ? (itemDiscountedTotal / discountedTotal) * gst : 0;

      const finalPriceWithGst = itemDiscountedTotal + itemGst;

      snapshotItems.push({
        itemId: product.id,
        name: product.name,
        quantity: item.quantity,
        price: price,
        discount: discountForItem,
        finalPrice: Number(finalPriceWithGst.toFixed(2)),
        currency: selectedCurrency,
      });
    }

    /* -------------------------------- */
    /* 8️⃣ CREATE PAYMENT ORDER          */
    /* -------------------------------- */

    await prisma.paymentOrder.create({
      data: {
        userId: session.user.id,
        contextType: "STORE_PRODUCT",

        razorpayOrderId: order.id,
        orderId: order.id,
        baseAmount: cartTotal,
        gstAmount: gst,
        discountApplied: discount,
        totalAmount: roundedTotal,

        currency: finalCurrency,
        status: "PENDING",

        couponId: coupon?.id ?? null,
        billingInfoId: billing.id,
        cartSnapshot: snapshotItems,

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
  } catch (error: unknown) {
    console.error("Store Payment Error:", error);

    return NextResponse.json(
      { success: false, error: `Unable to create order`, errrorDetails: error },
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
          // FULL DISCOUNT ONLY FOR GP
          if (product.currency === "GP") {
            discount = finalPrice;
          }
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

  const creatorIds = [
    ...new Set(
      items
        .map((i) => productMap.get(i.itemId)?.createdByUserId)
        .filter(Boolean) as string[],
    ),
  ];
  const creators = await prisma.user.findMany({
    where: { id: { in: creatorIds } },
    include: { plan: true },
  });
  const creatorMap = new Map(creators.map((c) => [c.id, c]));

  const order = await prisma.$transaction(
    async (tx) => {
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
            currency: products[0].currency,
          },
        });
      }
      const names = items.map(
        (i) => productMap.get(i.itemId)?.name ?? "Unknown Product",
      );
      const itemNames =
        names.length > 1
          ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1]
          : (names[0] ?? "Unknown Product");

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
          displayName: itemNames,
        },
      });
      await tx.cart.deleteMany({
        where: {
          userId: user.id,
          itemId: { in: items.map((i) => i.itemId) },
        },
      });

      for (const [creatorId, reward] of Object.entries(creatorRewards)) {
        const creator = creatorMap.get(creatorId);
        if (!creator) continue;
        const creatorNames = reward.items.map((i) => i.name);
        const creatorItemNames =
          creatorNames.length > 1
            ? creatorNames.slice(0, -1).join(", ") +
              " and " +
              creatorNames[creatorNames.length - 1]
            : (creatorNames[0] ?? "Unknown Product");

        await assignJp(creator, "STORE_SALE", tx, {
          amount: reward.amount,
          metadata: {
            buyerId: user.id,
            orderId: createdOrder.id,
            items: reward.items,
            displayName: creatorItemNames,
          },
        });
      }

      return createdOrder;
    },
    { timeout: 15000 },
  );
  // const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
  //   day: "numeric",
  //   month: "long",
  //   year: "numeric",
  // });

  // const itemNames = items
  //   .map((i) => {
  //     const product = productMap.get(i.itemId)!;
  //     return `${product.name ?? product.id} (×${i.quantity}) - ${product.basePrice} ${product.currency}`;
  //   })
  //   .join(", ");

  // const appUrl = process.env.NEXT_URL || "";
  await inngest.send({
    name: "mmp-challenge-store.notify",
    data: {
      userId: user.id,
      orderId: order.id, // ⚠️ This is NOT paymentOrder, but we will handle it
      entityType: "STORE",
      entityId: order.id,
      isFree: false,
      isWallet: true, // ✅ NEW FLAG
      walletCurrency: products[0].currency, // "GP"
      walletAmount: walletTotal,
    },
  });

  return NextResponse.json({
    success: true,
    type: "WALLET",
    order,
  });
}

async function verifyStoreCoupon({
  code,
  storeItemIds,
}: {
  code: string;
  currency: "INR" | "USD" | "GP";
  storeItemIds: string[];
  userId: string;
}) {
  const now = new Date();

  const coupon = await prisma.coupon.findUnique({
    where: { couponCode: code.toUpperCase() },
    include: {
      applicableStoreProducts: { select: { id: true } },
      _count: { select: { redemptions: true } },
    },
  });

  if (!coupon) {
    return { valid: false, message: "Invalid coupon code." };
  }

  if (coupon.status !== "ACTIVE") {
    return { valid: false, message: "Coupon inactive." };
  }

  if (now < coupon.startDate || now > coupon.endDate) {
    return { valid: false, message: "Coupon expired." };
  }

  // Get products
  const products = await prisma.item.findMany({
    where: { id: { in: storeItemIds } },
    select: {
      id: true,
      createdByUserId: true,
      creator: { select: { role: true } },
    },
  });

  const validItems: string[] = [];

  for (const product of products) {
    const creatorId = product.createdByUserId;
    const creatorRole = product.creator?.role;

    if (coupon.creatorUserId) {
      if (coupon.creatorUserId === creatorId) {
        validItems.push(product.id);
      }
    } else {
      if (creatorRole === "ADMIN") {
        validItems.push(product.id);
      }
    }
  }

  if (validItems.length === 0) {
    return {
      valid: false,
      message: "Coupon not applicable to selected items.",
    };
  }

  return {
    valid: true,
    applicableItemIds: validItems,
    coupon,
  };
}
