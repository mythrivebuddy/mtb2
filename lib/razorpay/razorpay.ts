import crypto from "crypto";
// import { prisma } from "@/lib/prisma";

/**
 * Verify Razorpay webhook signature
 * Razorpay uses HMAC SHA256 with webhook secret
 */
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

/**
 * Fetch Razorpay environment config (similar to getCashfreeConfig)
 */
export async function getRazorpayConfig() {
  // const settings = await prisma.adminRazorpayConfigSettings.findUnique({
  //   where: { id: 1 }
  // });

  // const mode = settings?.razorpayMode ?? "sandbox";
  // if (!mode) {
  //   throw new Error("Razorpay mode is not set");
  // }

  // console.log("Settings of admin for Razorpay", settings);
  // console.log("Razorpay mode", mode);

  // const keyId =
  //   mode === "prod"
  //     ? process.env.RAZORPAY_PROD_KEY_ID
  //     : process.env.RAZORPAY_SANDBOX_KEY_ID;

  // const keySecret =
  //   mode === "prod"
  //     ? process.env.RAZORPAY_PROD_KEY_SECRET
  //     : process.env.RAZORPAY_SANDBOX_KEY_SECRET;

  // const webhookSecret =
  //   mode === "prod"
  //     ? process.env.RAZORPAY_PROD_WEBHOOK_SECRET
  //     : process.env.RAZORPAY_SANDBOX_WEBHOOK_SECRET;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  // const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  // ---- Validations ----
  if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID is missing in environment variables");
  }

  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET is missing in environment variables");
  }

  // if (!webhookSecret) {
  //   throw new Error("RAZORPAY_WEBHOOK_SECRET is missing in environment variables");
  // }

  return {
    // mode,
    keyId,
    keySecret,
    // webhookSecret,
    // settings
  };
}
