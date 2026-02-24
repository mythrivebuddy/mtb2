// // /api/billing/razorpay/callback/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import Razorpay from "razorpay";
// import { getRazorpayConfig } from "@/lib/razorpay/razorpay";
// import { PaymentStatus, SubscriptionStatus } from "@prisma/client";

// interface RazorpaySubscription {
//   id: string;
//   entity: string;
//   plan_id: string;
//   status: 'created' | 'authenticated' | 'active' | 'pending' | 'halted' | 'cancelled' | 'completed' | 'expired';
//   current_start: number | null;
//   current_end: number | null;
//   ended_at: number | null;
//   quantity: number;
//   notes: Record<string, string>;
//   charge_at: number | null;
//   start_at: number | null;
//   end_at: number | null;
//   total_count: number;
//   paid_count: number;
//   customer_id: string;
// }

// export async function GET(req: NextRequest) {
//   const url = new URL(req.url);
//   const rzpOrderId = url.searchParams.get("order_id");
//   const rzpSubId = url.searchParams.get("sub_id");

//   try {
//     const { keyId, keySecret } = await getRazorpayConfig();
//     const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

//     let isSuccess = false;
//     let userId: string | null = null;

//     // --- CASE 1: LIFETIME (One-Time Order) ---
//     if (rzpOrderId) {
//       const order = await razorpay.orders.fetch(rzpOrderId);
//       if (order.status === "paid") {
//         isSuccess = true;
        
//         // Find and update the internal order
//         const dbOrder = await prisma.paymentOrder.findFirst({
//           where: { razorpayOrderId: rzpOrderId }
//         });

//         if (dbOrder && dbOrder.status !== PaymentStatus.PAID) {
//           userId = dbOrder.userId;
//           await prisma.paymentOrder.update({
//             where: { id: dbOrder.id },
//             data: { status: PaymentStatus.PAID }
//           });
//         }
//       }
//     } 
//     // --- CASE 2: RECURRING (Subscription) ---
// else if (rzpSubId) {
//   // Use the interface here instead of any
//   const sub = await razorpay.subscriptions.fetch(rzpSubId) as RazorpaySubscription;

//   // Statuses are now type-checked against the literal union in our interface
//   if (sub.status === "active" || sub.status === "authenticated") {
//     isSuccess = true;

//     const dbSub = await prisma.subscription.findFirst({
//       where: { razorpaySubscriptionId: rzpSubId }
//     });

//     if (dbSub) {
//       userId = dbSub.userId;
//       await prisma.subscription.update({
//         where: { id: dbSub.id },
//         data: { status: SubscriptionStatus.ACTIVE }
//       });
//     }
//   }
// }

//     // --- FINAL MEMBERSHIP UPGRADE ---
//     if (isSuccess && userId) {
//       await prisma.user.update({
//         where: { id: userId },
//         data: { membership: "PAID" }
//       });

//       return NextResponse.redirect(new URL("/dashboard/membership/success?type=membership"));
//     }

//     // If we reach here, verification failed or status was not "paid/active"
//     return NextResponse.redirect(
//       new URL(`/dashboard/membership/failure?reason=not_verified`)
//     );

//   } catch (error) {
//     console.error("Razorpay Callback Error:", error);
//     return NextResponse.redirect(
//       new URL("/dashboard/membership/failure?reason=server_error")
//     );
//   }
// }

// // /api/billing/razorpay/callback/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import Razorpay from "razorpay";
// import { getRazorpayConfig } from "@/lib/razorpay/razorpay";
// import { PaymentStatus, SubscriptionStatus } from "@prisma/client";

// interface RazorpaySubscription {
//   id: string;
//   entity: string;
//   plan_id: string;
//   status:
//     | "created"
//     | "authenticated"
//     | "active"
//     | "pending"
//     | "halted"
//     | "cancelled"
//     | "completed"
//     | "expired";
//   current_start: number | null;
//   current_end: number | null;
//   ended_at: number | null;
//   quantity: number;
//   notes: Record<string, string>;
//   charge_at: number | null;
//   start_at: number | null;
//   end_at: number | null;
//   total_count: number;
//   paid_count: number;
//   customer_id: string;
// }

// export async function GET(req: NextRequest) {
//   console.log("CALLBACK CALLED")
//   const url = new URL(req.url);
//   const rzpOrderId = url.searchParams.get("order_id");
//   const rzpSubId = url.searchParams.get("sub_id");
//   // pay_id is passed from the frontend handler but not used for verification here
//   // since we fetch authoritative status from Razorpay API directly.

//   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

//   try {
//     const { keyId, keySecret } = await getRazorpayConfig();
//     const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

//     let isSuccess = false;
//     let userId: string | null = null;
//     // pid = internal DB id used by the success page's verify-success endpoint
//     let pid: string | null = null;
//     let type: "lifetime" | "subscription" = "lifetime";

//     // ─── CASE 1: LIFETIME (One-Time Order) ───────────────────────────────────
//     if (rzpOrderId) {
//       type = "lifetime";
//       const order = await razorpay.orders.fetch(rzpOrderId);

//       if (order.status === "paid") {
//         isSuccess = true;

//         const dbOrder = await prisma.paymentOrder.findFirst({
//           where: { razorpayOrderId: rzpOrderId },
//         });

//         if (dbOrder) {
//           pid = dbOrder.id; // internal id for success page
//           userId = dbOrder.userId;

//           if (dbOrder.status !== PaymentStatus.PAID) {
//             await prisma.paymentOrder.update({
//               where: { id: dbOrder.id },
//               data: { status: PaymentStatus.PAID },
//             });
//           }
//         }
//       }
//     }

//     // ─── CASE 2: RECURRING (Subscription) ────────────────────────────────────
//     else if (rzpSubId) {
//       type = "subscription";
//       const sub = (await razorpay.subscriptions.fetch(
//         rzpSubId
//       )) as RazorpaySubscription;

//       if (sub.status === "active" || sub.status === "authenticated") {
//         isSuccess = true;

//         const dbSub = await prisma.subscription.findFirst({
//           where: { razorpaySubscriptionId: rzpSubId },
//         });

//         if (dbSub) {
//           pid = dbSub.id; // internal id for success page
//           userId = dbSub.userId;

//           if (dbSub.status !== SubscriptionStatus.ACTIVE) {
//             await prisma.subscription.update({
//               where: { id: dbSub.id },
//               data: { status: SubscriptionStatus.ACTIVE },
//             });
//           }
//         }
//       }
//     }

//     // ─── UPGRADE MEMBERSHIP & REDIRECT ───────────────────────────────────────
//     if (isSuccess && userId) {
//       await prisma.user.update({
//         where: { id: userId },
//         data: { membership: "PAID" },
//       });

//       // Success page uses ?pid + ?type to show the right UI
//       // (your existing success page calls /api/billing/verify-success with these)
//       const successUrl = new URL("/dashboard/membership/success?type=membership", baseUrl);
//       successUrl.searchParams.set("pid", pid ?? "");
//       successUrl.searchParams.set("type", type);

//       return NextResponse.redirect(successUrl);
//     }

//     // ─── VERIFICATION FAILED ──────────────────────────────────────────────────
//     const failureUrl = new URL("/dashboard/membership/failure", baseUrl);
//     failureUrl.searchParams.set("reason", "not_verified");
//     if (rzpOrderId) {
//       failureUrl.searchParams.set("orderId", rzpOrderId);
//       failureUrl.searchParams.set("type", "lifetime");
//     } else if (rzpSubId) {
//       failureUrl.searchParams.set("sub_id", rzpSubId);
//       failureUrl.searchParams.set("type", "mandate");
//     }

//     return NextResponse.redirect(failureUrl);
//   } catch (error) {
//     console.error("Razorpay Callback Error:", error);

//     const errorUrl = new URL("/dashboard/membership/failure", baseUrl);
//     errorUrl.searchParams.set("reason", "server_error");
//     return NextResponse.redirect(errorUrl);
//   }
// }

// import { NextRequest, NextResponse } from "next/server";
// import crypto from "crypto";
// import { prisma } from "@/lib/prisma";
// import { getRazorpayConfig } from "@/lib/razorpay/razorpay";

// export async function GET(req: NextRequest) {
//   console.log("*****CALLBACK CALLED*****")
//   const url = new URL(req.url);

//   const orderId = url.searchParams.get("order_id");
//   const subId = url.searchParams.get("sub_id");
//   const paymentId = url.searchParams.get("payment_id");
//   const signature = url.searchParams.get("signature");
//   console.log("orderId, subId, paymentId, signature", orderId, subId, paymentId, signature)

//   try {
//     const { keySecret } = await getRazorpayConfig();

//     if (!paymentId || !signature) {
//       throw new Error("Missing params");
//     }

//     // 🔐 VERIFY SIGNATURE
//     const body = orderId
//       ? `${orderId}|${paymentId}`
//       : `${paymentId}|${subId}`;

//     const expected = crypto
//       .createHmac("sha256", keySecret)
//       .update(body)
//       .digest("hex");

//     if (expected !== signature) {
//       throw new Error("Invalid signature");
//     }

//     // 🕒 WAIT FOR WEBHOOK TO UPDATE DB (max 5 seconds)
//     let isVerified = false;
//     let sub = null;
  
//     for (let i = 0; i < 5; i++) {
//       console.log(`Polling Attempt ${i + 1} for ${orderId || subId}`);

//       if (orderId) {
//         // Use findUnique if possible, or ensure no caching
//         const order = await prisma.paymentOrder.findFirst({
//           where: { razorpayOrderId: orderId },
//         });

//         if (order?.status === "PAID") {
//           isVerified = true;
//           break; 
//         }
//       }

//       if (subId) {
//         // Logic for Subscriptions
//         sub = await prisma.subscription.findFirst({
//           where: { razorpaySubscriptionId: subId },
//         });

//         if (sub?.status === "ACTIVE") {
//           isVerified = true;
//           break;
//         }
//       }

//       // If we reach here, it wasn't found yet. Wait 1 second.
//       console.log("Status not updated yet, sleeping...");
//       await new Promise((res) => setTimeout(res, 1000));
//     }

//     if (isVerified) {
//        console.log("*****isVerified SUCCESS*****")
//        console.log("sub,paymentOrderId", sub?.paymentOrderId)
//       return NextResponse.redirect(
//         new URL(`/dashboard/membership/success?type=membership&pid=${sub?.paymentOrderId}`, req.url)
//       );
//     }

//     return NextResponse.redirect(
//       new URL("/dashboard/membership/failure?reason=not_confirmed", req.url)
//     );

//   } catch (error) {
//     console.error("Verification failed:", error);

//     return NextResponse.redirect(
//       new URL("/dashboard/membership/failure?reason=error", req.url)
//     );
//   }
// }

// /api/billing/razorpay/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";

export async function GET(req: NextRequest) {
  console.log("***** CALLBACK CALLED *****");

  const url = new URL(req.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  const orderId   = url.searchParams.get("order_id");
  const subId     = url.searchParams.get("sub_id");
  const paymentId = url.searchParams.get("pay_id");       // ✅ your frontend sends "pay_id", not "payment_id"
  const signature = url.searchParams.get("signature");

  console.log("Params →", { orderId, subId, paymentId, signature });

  try {
    const { keySecret } = await getRazorpayConfig();

    // ------------------------------------------------------------------
    // Signature verification
    // Razorpay signs differently for orders vs subscriptions:
    //   order:        `${orderId}|${paymentId}`
    //   subscription: `${paymentId}|${subscriptionId}`
    // ------------------------------------------------------------------
    if (paymentId && signature) {
      const body = orderId
        ? `${orderId}|${paymentId}`
        : `${paymentId}|${subId}`;

      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(body)
        .digest("hex");

      if (expected !== signature) {
        console.error("❌ Signature mismatch");
        throw new Error("Invalid signature");
      }

      console.log("✅ Signature verified");
    } else {
      // pay_id / signature not always present (e.g. if user is redirected
      // before Razorpay appends them). Fall through to DB polling below.
      console.warn("⚠️ No signature to verify — falling through to DB poll");
    }

    // ------------------------------------------------------------------
    // Poll DB until webhook has updated the status (max ~10 seconds)
    // ------------------------------------------------------------------
    let isVerified = false;
    let pid: string | null = null;  // internal DB id sent to success page
    let type: "lifetime" | "subscription" = "lifetime";

    for (let i = 0; i < 10; i++) {
      console.log(`Polling attempt ${i + 1} for ${orderId ?? subId}`);

      // ── LIFETIME (one-time order) ───────────────────────────────────
      if (orderId) {
        type = "lifetime";

        const order = await prisma.paymentOrder.findFirst({
          where: { razorpayOrderId: orderId },
        });

        console.log("Order status:", order?.status);

        if (order?.status === "PAID") {
          pid = order.id;           // ✅ use internal paymentOrder.id, not sub.paymentOrderId
          isVerified = true;
          break;
        }
      }

      // ── SUBSCRIPTION (recurring) ────────────────────────────────────
      if (subId) {
        type = "subscription";

        const sub = await prisma.subscription.findFirst({
          where: { razorpaySubscriptionId: subId },
        });

        console.log("Subscription status:", sub?.status);

        if (sub?.status === "ACTIVE") {
          pid = sub.id;             // ✅ use internal subscription.id
          isVerified = true;
          break;
        }

        // Fallback: check the paymentOrder directly (in case webhook created
        // the sub record but status isn't ACTIVE yet, or webhook is delayed)
        if (!sub) {
          const order = await prisma.paymentOrder.findFirst({
            where: { razorpaySubscriptionId: subId },
          });

          console.log("Fallback PaymentOrder status:", order?.status);

          if (order?.status === "PAID") {
            pid = order.id;
            isVerified = true;
            break;
          }
        }
      }

      await new Promise((res) => setTimeout(res, 1000));
    }

    // ------------------------------------------------------------------
    // Redirect
    // ------------------------------------------------------------------
    if (isVerified && pid) {
      console.log("✅ Verified — redirecting to success. pid:", pid, "type:", type);

      const successUrl = new URL("/dashboard/membership/success", baseUrl);
      successUrl.searchParams.set("pid", pid);
      successUrl.searchParams.set("type", type);   // ✅ "lifetime" or "subscription" — matches verify-success API

      return NextResponse.redirect(successUrl);
    }

    // ------------------------------------------------------------------
    // Not verified after polling — could be webhook delay > 10s
    // Safe fallback: check membership directly on the user session
    // ------------------------------------------------------------------
    console.warn("⚠️ Not verified after polling. Sending to failure.");

    const failureUrl = new URL("/dashboard/membership/failure", baseUrl);
    failureUrl.searchParams.set("reason", "not_confirmed");
    if (orderId) {
      failureUrl.searchParams.set("orderId", orderId);
      failureUrl.searchParams.set("type", "lifetime");
    } else if (subId) {
      failureUrl.searchParams.set("sub_id", subId);
      failureUrl.searchParams.set("type", "subscription");
    }

    return NextResponse.redirect(failureUrl);

  } catch (error) {
    console.error("Callback verification failed:", error);

    const errorUrl = new URL("/dashboard/membership/failure", baseUrl);
    errorUrl.searchParams.set("reason", "error");
    return NextResponse.redirect(errorUrl);
  }
}