import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function verifyCashfreeSignature(
  timestamp: string,
  rawBody: string,
  signature: string,
  secret: string
) {
  const body = timestamp + rawBody;
  const genSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64");
  return genSignature === signature;
}



// for getting the cashfree environment config
export async function getCashfreeConfig() {
  const settings = await prisma.adminCashfreeConfigSettings.findUnique({
    where: { id: 1 }
  });

  const mode = settings?.cashfreeMode ?? "sandbox";
  if (!mode) {
    throw new Error("Cashfree mode is not set");
  }
  console.log("Settings of admin for this cashfree ",settings);
  
  console.log("mode at getcashfreeeConfig util function ",mode);
  

  const prodURL = process.env.CASHFREE_PROD_BASE_URL;
  const sandboxURL = process.env.CASHFREE_SANDBOX_BASE_URL;
  
  const appId = mode === "prod" ? process.env.CASHFREE_PROD_CLIENT_ID : process.env.CASHFREE_SANDBOX_CLIENT_ID;
  const secret = mode === "prod" ? process.env.CASHFREE_PROD_CLIENT_SECRET : process.env.CASHFREE_SANDBOX_CLIENT_SECRET;

  // Validate common envs
  if (!appId) {
    throw new Error("CASHFREE_APP_ID is missing in environment variables");
  }

  if (!secret) {
    throw new Error("CASHFREE_APP_SECRET is missing in environment variables");
  }

  // Validate URLs based on mode
  if (mode === "prod" && !prodURL) {
    throw new Error(
      "CASHFREE_PROD_BASE_URL is missing but environment is set to prod"
    );
  }

  if (mode === "sandbox" && !sandboxURL) {
    throw new Error(
      "CASHFREE_SANDBOX_BASE_URL is missing but environment is set to sandbox"
    );
  }

  const baseUrl = mode === "prod" ? prodURL! : sandboxURL!;

  return {
    baseUrl,
    mode,
    appId,
    secret,
    settings
  };
}
