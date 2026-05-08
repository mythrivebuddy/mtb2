import { Prisma, PaymentContextType, PrismaClient } from "@prisma/client";

type CreateAffiliateEarningInput = {
  tx: Prisma.TransactionClient | PrismaClient;
  order: {
    id: string;
    userId: string;
    totalAmount: number;
    baseAmount: number;
    gstAmount: number;
    discountApplied: number;
    currency: string;
    contextType?: PaymentContextType | null;
  };
  isAdmin?: boolean;
  adminItemIds?: string[];
};

export async function createAffiliateEarningForSubscription({
  tx,
  order,
  isAdmin,
  adminItemIds,
}: CreateAffiliateEarningInput): Promise<void> {
  try {
    // 0 HARD IDEMPOTENCY CHECK (VERY IMPORTANT)
    // ✅ ONLY for STORE_PRODUCT use adminItemIds
    console.log("🚀 Affiliate Function Start", {
      orderId: order.id,
      contextType: order.contextType,
      isAdmin,
      adminItemIds,
    });

    const isStore = order.contextType === "STORE_PRODUCT";
    console.log("🧪 STORE CHECK:", {
      isStore,
      isAdmin,
      adminItemIdsLength: adminItemIds?.length,
    });

    if (isStore && (!isAdmin || !adminItemIds?.length)) {
      // store but no admin items → skip
      console.log(
        "Skipping affiliate earning creation for store product without admin items",
      );
      return;
    }

    if (!isAdmin) {
      // Skip affiliate for creator products
      console.log(
        "Skipping affiliate earning creation for normal mtbcreator product",
      );
      return;
    }
    console.log({ isAdmin });
    console.log("Admin Item IDs for affiliate earning:", adminItemIds);
  

    // 1️⃣ Fetch referred user
    const referredUser = await tx.user.findUnique({
      where: { id: order.userId },
      select: {
        id: true,
        referredById: true,
      },
    });
    console.log("👤 Referred User:", referredUser);
    if (!referredUser?.referredById) return;

    // 2️⃣ Fetch affiliate
    const affiliate = await tx.user.findUnique({
      where: { id: referredUser.referredById },
      select: {
        id: true,
        isAffiliate: true,
        affiliatePercent: true,
        affiliateCommissionType: true,
      },
    });

    if (!affiliate?.isAffiliate || !affiliate.affiliatePercent) return;

    const commissionType = affiliate.affiliateCommissionType;
    const contextType = order.contextType ?? "SUBSCRIPTION";

    const isEligible =
      commissionType === "MTB" || // ✅ everything allowed
      (commissionType === "SUBSCRIPTION" && contextType === "SUBSCRIPTION"); // ✅ limited
    console.log("⚖️ Eligibility Check:", {
      commissionType,
      contextType,
      isEligible,
    });
    if (!isEligible) return;

    // 3️⃣ Calculate base amount (EXCLUDING GST)
    let baseAmount = 0;
    let discountAmount = 0;
    let netAmount = 0;
    if (isStore) {
      const paymentOrder = await tx.paymentOrder.findUnique({
        where: { id: order.id },
        select: { cartSnapshot: true },
      });

      const cartSnapshot = paymentOrder?.cartSnapshot as {
        itemId: string;
        price: number;
        discount: number;
        quantity: number;
      }[];

      if (!cartSnapshot?.length) {
        console.log("❌ No cartSnapshot found");
        return;
      }

      // ✅ filter only admin items
      const adminItems = cartSnapshot.filter((item) =>
        adminItemIds?.includes(item.itemId),
      );

      if (!adminItems.length) {
        console.log("❌ No matching admin items");
        return;
      }

      console.log("🧾 Admin Items:", adminItems);

      // ✅ CREATE ONE ROW PER ITEM
      for (const item of adminItems) {
        const price = item.price || 0;
        const discount = item.discount || 0;
        const quantity = item.quantity || 1;

        const baseAmount = price * quantity;
        const discountAmount = discount * quantity;

        const netAmount = Math.max(0, baseAmount - discountAmount);
        if (netAmount <= 0) continue;

        // const earnedAmount = (baseAmount * affiliate.affiliatePercent) / 100;
        const earnedAmount = (netAmount * affiliate.affiliatePercent) / 100;

      

        await tx.affiliateEarningLedger.upsert({
          where: {
            paymentOrderId_affiliateId_contextId_contextType_currency: {
              paymentOrderId: order.id,
              affiliateId: affiliate.id,
              contextId: item.itemId,
              contextType: "STORE_PRODUCT",
              currency: order.currency,
            },
          },
          update: {},
          create: {
            affiliateId: affiliate.id,
            referredUserId: referredUser.id,
            paymentOrderId: order.id,

            contextId: item.itemId, 
            contextType: "STORE_PRODUCT",

            baseAmount,
            discountAmount,
            commissionRate: affiliate.affiliatePercent,
            earnedAmount,
            currency: order.currency,
            commissionType,
          },
        });

        console.log("✅ Affiliate earning created for item:", {
          itemId: item.itemId,
          baseAmount,
          earnedAmount,
        });
      }

      return;
    } else {
      // ✅ existing logic (subscription / mmp / challenge)
      baseAmount = order.baseAmount || 0;
      discountAmount = order.discountApplied || 0;

      netAmount = Math.max(0, baseAmount - discountAmount);
    }
    console.log({
      baseAmount,
      order,
    });

    if (netAmount <= 0) return;

    const earnedAmount = (netAmount * affiliate.affiliatePercent) / 100;
    // 4️⃣ Create earning
    await tx.affiliateEarningLedger.upsert({
      where: {
        paymentOrderId_affiliateId_contextId_contextType_currency: {
          paymentOrderId: order.id,
          affiliateId: affiliate.id,
          contextId: order.id,
          contextType: order.contextType ?? "SUBSCRIPTION",
          currency: order.currency,
        },
      },
      update: {},
      create: {
        affiliateId: affiliate.id,
        referredUserId: referredUser.id,
        paymentOrderId: order.id,

        contextId: order.id,
        contextType: order.contextType ?? "SUBSCRIPTION",

        baseAmount,
        discountAmount,
        commissionRate: affiliate.affiliatePercent,
        earnedAmount,
        currency: order.currency,
        commissionType: commissionType,
      },
    });
    console.log("✅ Affiliate earning created", {
      orderId: order.id,
      baseAmount,
      earnedAmount,
      currency: order.currency,
      discountApplied: order.discountApplied,
    });
  } catch (err: unknown) {
    // ✅ DB-level idempotency fallback
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return;
    }

    console.error("Affiliate earning creation failed:", err);
  }
}
