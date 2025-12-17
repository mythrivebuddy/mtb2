// /api/billing/one-time-plan-webhook
import { NextResponse } from "next/server";
import { getCashfreeConfig } from "@/lib/cashfree/cashfree";
import {
  handleFailedPayment,
  handleSuccessfulPayment,
  isPaymentFailureEvent,
  isPaymentSuccessEvent,
  verifySignature,
} from "@/lib/payment/payment.utils";
import { CashfreeWebhookPayload } from "@/types/client/subscription";

export function extractPurchaseId(orderId?: string): string | null {
  // Expected format: plan_<paymentOrderId>_<timestamp>
  if (!orderId) return null;
  if (!orderId.startsWith("plan_")) return null;

  const parts = orderId.split("_");
  return parts.length >= 3 ? parts[1] : null; 
}


export async function POST(req: Request) {
  const rawBody = await req.text();
  const { secret } = await getCashfreeConfig();
  console.log("webhook triggers ✅🚀");
  

  // ✅ ALWAYS ACK IMMEDIATELY
  const response = NextResponse.json({ ok: true });

  if (!verifySignature(req, rawBody, secret)) {
    console.log("secret not verified");
    
    return response;
  }

  const body = JSON.parse(rawBody) as CashfreeWebhookPayload;
  const orderId = body.data?.order?.order_id;
  const paymentOrderId = extractPurchaseId(orderId);

  if (!paymentOrderId) return response;

  if (isPaymentSuccessEvent(body.type)) {

    
    setImmediate(() =>{
          console.log("success payment ");
      handleSuccessfulPayment(paymentOrderId, orderId).catch(console.error)
    }
    );
  }

  if (isPaymentFailureEvent(body.type)) {

    setImmediate(() =>{
          console.log("failed payment ");
      handleFailedPayment(paymentOrderId).catch(console.error)
    }
    );
  }

  return response;
}
