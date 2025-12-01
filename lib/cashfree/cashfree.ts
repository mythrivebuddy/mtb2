import crypto from "crypto";

export function verifyCashfreeSignature(
  timestamp: string,
  rawBody: string,
  signature: string
) {
  const body = timestamp + rawBody;
  const secret = process.env.CASHFREE_CLIENT_SECRET!;
  const genSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64");
  return genSignature === signature;
}