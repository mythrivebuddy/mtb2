import Razorpay from "razorpay";
import crypto from "crypto";
import { getRazorpayConfig } from "@/lib/razorpay/razorpay";

export async function createRazorpayOrder(
  amount: number,
  currency: "INR" | "USD",
  options?: {
    notes?: Record<string, string>;
  }
) {
  const { razorpayKeyId, razorpayKeySecret } = await getRazorpayConfig();

  const razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
  console.log({options});
  
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt: crypto.randomBytes(10).toString("hex"),
    notes: options?.notes,
  });

  return {
    order,
    key: razorpayKeyId,
  };
}