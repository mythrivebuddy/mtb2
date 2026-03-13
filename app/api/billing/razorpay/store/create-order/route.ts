import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

import { convertCurrency } from "@/lib/payment/payment.utils";
import { createRazorpayOrder } from "@/lib/payment/createRazorpayOrder";
import { validateCoupon } from "@/lib/payment/coupons/coupons.service";
import { calculatePayment } from "@/lib/payment/pricingService";
import { Prisma } from "@prisma/client";

type Currency = "INR" | "USD";

interface StoreItem {
    itemId: string;
    quantity: number;
}

interface CreateStoreOrderRequest {
    items: StoreItem[];
    currency: Currency;
    couponCode?: string;
}

export async function POST(req: NextRequest) {
    try {
        const session = await checkRole("USER");

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { items, couponCode, currency: selectedCurrency }: CreateStoreOrderRequest = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json(
                { success: false, error: "Items required" },
                { status: 400 }
            );
        }

        const productIds = [...new Set(items.map(i => i.itemId))];

        const products = await prisma.item.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                basePrice: true,
                currency: true
            }
        });

        if (products.length !== productIds.length) {
            return NextResponse.json(
                { success: false, error: "Some products not found" },
                { status: 400 }
            );
        }

        const productMap = new Map(products.map(p => [p.id, p]));

        let amount = 0;

        for (const item of items) {
            const product = productMap.get(item.itemId);
            if (!product) continue;

            let price = product.basePrice ?? 0;

            if (product.currency !== selectedCurrency) {
                price = await convertCurrency(
                    price,
                    product.currency as Currency,
                    selectedCurrency
                );
            }

            amount += price * item.quantity;
        }


        const billing = await prisma.userBillingInformation.findFirst({
            where: { userId: session.user.id },
            select: { id: true, country: true }
        });

        if (!billing) {
            return NextResponse.json(
                { success: false, error: "Billing address not found" },
                { status: 400 }
            );
        }


        const finalCurrency: Currency = selectedCurrency;
        const finalAmount = amount;


        const coupon = couponCode
            ? await validateCoupon({
                couponCode,
                scope: "STORE_PRODUCT",
                entityId: products[0].id
            })
            : null;


        const isIndia =
            billing.country === "IN";

        /* -------------------------------- */


        const { discount, totalAmount, gst } = calculatePayment({
            baseAmount: finalAmount,
            coupon,
            currency: finalCurrency,
            isIndia
        });
        const roundedTotal = Number(totalAmount.toFixed(2));

        const { order, key } = await createRazorpayOrder(
            roundedTotal,
            finalCurrency
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
                storeOrderId: null
            }
        });

        return NextResponse.json({
            success: true,
            key,
            orderId: order.id
        });

    } catch (error) {
        console.error("Store Payment Error:", error);

        return NextResponse.json(
            { success: false, error: "Unable to create order" },
            { status: 500 }
        );
    }
}