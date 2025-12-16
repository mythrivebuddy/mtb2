// /api/billing/verify-success/route.ts

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    PaymentStatus,
    SubscriptionStatus,
    PlanInterval,
    PlanUserType
} from "@prisma/client";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pid = searchParams.get("pid");
    const type = searchParams.get("type");

    if (!pid || !type) {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    /* ================================================================
       PROGRAM PURCHASE SUCCESS
       ================================================================ */

    if (type === "program") {
        const purchase = await prisma.oneTimeProgramPurchase.findFirst({
            where: {
                id: pid,
                userId: session.user.id,
                status: PaymentStatus.PAID
            },
            include: {
                user: true,
                plan: true,
                freeSubscription: {
                    include: { plan: true }
                }
            }
        });

        if (!purchase) {
            return NextResponse.json({ ok: false }, { status: 403 });
        }

        /**
         * CASE 1: Webhook already completed
         * ---------------------------------
         * freeSubscription exists → use DB truth
         */
        if (purchase.freeSubscription?.plan) {
            return NextResponse.json({
                ok: true,
                redirect: "/dashboard/subscription",
                yearlyPlanName: purchase.freeSubscription.plan.name,
                provisioning: false
            });
        }

        let effectiveUserType: PlanUserType | undefined;

        if (purchase.plan.userType && purchase.plan.userType !== "ALL") {
            effectiveUserType = purchase.plan.userType;
        } else if (purchase.user.userType) {
            effectiveUserType = purchase.user.userType;
        }

        const yearlyPlan = await prisma.subscriptionPlan.findFirst({
            where: {
                interval: PlanInterval.YEARLY,
                userType: effectiveUserType,
                isActive: true
            }
        });

        return NextResponse.json({
            ok: true,
            redirect: "/dashboard/subscription",
            yearlyPlanName: yearlyPlan?.name ?? "Yearly Subscription",
            provisioning: true
        });
    }

    /* ================================================================
       MEMBERSHIP-ONLY PURCHASE SUCCESS
       ================================================================ */

    if (type === "membership") {
        const sub = await prisma.subscription.findFirst({
            where: {
                grantedByPurchaseId: pid,
                userId: session.user.id,
                status: SubscriptionStatus.ACTIVE
            },
            include: { plan: true }
        });

        if (!sub) {
            return NextResponse.json({ ok: false }, { status: 403 });
        }

        return NextResponse.json({
            ok: true,
            redirect: "/dashboard",
            yearlyPlanName: sub.plan.name,
            provisioning: false
        });
    }

    return NextResponse.json({ ok: false }, { status: 400 });
}
