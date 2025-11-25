import crypto from "crypto";

export function generateVerificationHash(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
