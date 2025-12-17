import { getCashfreeConfig } from "@/lib/cashfree/cashfree";
import { checkRole } from "@/lib/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDiscount, calculateFinal } from "@/lib/payment/payment.utils";
import { PaymentStatus } from "@prisma/client";

export const POST = async (req: NextRequest) => {
    try {
        const { planId, couponCode, billingDetails } = await req.json();
        const session = await checkRole("USER");
        const userId = session.user.id;
        const { baseUrl, appId, secret, } = await getCashfreeConfig();

        if (!billingDetails?.country)
            return NextResponse.json({ error: "Billing details missing" }, { status: 400 });

        const isIndia = billingDetails.country === "IN";

        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
        });

        if (!plan)
            return NextResponse.json({ error: "Invalid Plan" }, { status: 400 });

        const currency = isIndia ? "INR" : "USD";
        const baseAmount = isIndia ? plan.amountINR : plan.amountUSD;
        const gstRate = plan.gstPercentage / 100;

        // 2. Coupon
        let coupon = null;
        if (couponCode) {
            coupon = await prisma.coupon.findUnique({ where: { couponCode } });
            if (!coupon) return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
        }

        const discountValue = calculateDiscount(baseAmount, coupon);

        // 3. Final amount
        const finalAmount = calculateFinal(
            baseAmount,
            discountValue,
            isIndia,
            plan.gstEnabled,
            gstRate
        );

        const billingInfo = await prisma.billingInformation.upsert({
            where: { userId },
            update: {
                fullName: billingDetails.name,
                email: billingDetails.email,
                phone: billingDetails.phone,
                addressLine1: billingDetails.addressLine1,
                addressLine2: billingDetails.addressLine2 || "",
                city: billingDetails.city,
                state: billingDetails.state,
                postalCode: billingDetails.postalCode,
                country: billingDetails.country,
            },
            create: {
                userId,
                fullName: billingDetails.name,
                email: billingDetails.email,
                phone: billingDetails.phone,
                addressLine1: billingDetails.addressLine1,
                addressLine2: billingDetails.addressLine2 || "",
                city: billingDetails.city,
                state: billingDetails.state,
                postalCode: billingDetails.postalCode,
                country: billingDetails.country,
            },
        });
        const payableAmount = finalAmount <= 0 ? 1 : finalAmount;
        const paymentOrder = await prisma.paymentOrder.create({
            data: {
                planId: plan.id,
                userId: userId,
                currency: currency,
                couponId: coupon?.id,
                status: PaymentStatus.CREATED,
                baseAmount,
                gstAmount:
                    isIndia && plan.gstEnabled
                        ? parseFloat(((baseAmount - discountValue) * gstRate).toFixed(2))
                        : 0,
                discountApplied: discountValue,
                totalAmount: finalAmount,
                billingInfoId: billingInfo.id
            }
        });

        const orderId = `plan_${paymentOrder.id}_${Date.now()}`;
        console.log({orderId,purchaseId:paymentOrder.id});
        

        const payload = {
            order_id: orderId,
            order_amount: payableAmount,
            order_currency: currency,
            customer_details: {
                customer_id: userId,
                customer_name: billingDetails.name,
                customer_email: billingDetails.email,
                customer_phone: billingDetails.phone || "9999999999"
            },
            order_meta: {
                purchase_id: paymentOrder.id,
                return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/one-time-plan-callback?purchase_id=${paymentOrder.id}&order_id=${orderId}`,
                // notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/one-time-plan-webhook`
                notify_url: `https://c1ae30001eb6.ngrok-free.app/api/billing/one-time-plan-webhook`
            },
            order_note: `Plan Purchase: ${plan.name}`
        };

        const resp = await fetch(`${baseUrl}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": appId,
                "x-client-secret": secret,
                "x-api-version": "2023-08-01"
            },
            body: JSON.stringify(payload)
        });

        const cf = await resp.json();

        if (!resp.ok) {
            return NextResponse.json(
                { error: cf.message || "Cashfree order creation failed" },
                { status: 500 }
            );
        }
        await prisma.paymentOrder.update({
            where: { id: paymentOrder.id },
            data: {
                orderId,
                cashfreeOrderId: cf.order_id,
                status: PaymentStatus.PENDING
            }
        });

        return NextResponse.json({
            paymentSessionId: cf.payment_session_id,
            orderId,
            purchaseId: paymentOrder.id,
        });


    } catch (error) {
        console.error("Plan purchase Error: ", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
