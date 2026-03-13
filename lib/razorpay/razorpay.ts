import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function verifyRazorpaySignature(
  rawBody: string,
  razorpaySignature: string,
  webhookSecret: string
) {
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === razorpaySignature;
}


export async function getRazorpayConfig() {
  const settings = await prisma.adminRazorpayConfigSettings.findFirst({
    where: { id: 1 }
  });

  const mode = settings?.razorpayMode ?? "test";

  if (!mode) {
    throw new Error("Razorpay mode is not set");
  }

  const razorpayKeyId =
    mode === "live"
      ? process.env.RAZORPAY_PROD_KEY_ID
      : process.env.RAZORPAY_TEST_KEY_ID;

  const razorpayKeySecret =
    mode === "live"
      ? process.env.RAZORPAY_PROD_KEY_SECRET
      : process.env.RAZORPAY_TEST_KEY_SECRET;

  const razorpayWebhookSecret =
    mode === "live"
      ? process.env.RAZORPAY_PROD_WEBHOOK_SECRET
      : process.env.RAZORPAY_TEST_WEBHOOK_SECRET;

  if (!razorpayKeyId) {
    throw new Error("RAZORPAY_KEY_ID is missing");
  }

  if (!razorpayKeySecret) {
    throw new Error("RAZORPAY_KEY_SECRET is missing");
  }

  if (!razorpayWebhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is missing");
  }

  return {
    mode,
    razorpayKeyId,
    razorpayKeySecret,
    razorpayWebhookSecret,
    settings
  };
}

