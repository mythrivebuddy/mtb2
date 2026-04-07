import { sign } from "jsonwebtoken";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";

export interface VerificationTokenResult {
  token: string;
  expires: Date;
}

export function generateVerificationToken(email: string): VerificationTokenResult {
  const token = sign({ email }, process.env.JWT_SECRET!, {
    expiresIn: "24h",
  });

  return {
    token,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${process.env.NEXT_URL}/verify-email?token=${token}`;

  await sendEmailUsingTemplate({
    toEmail: email,
    toName: name,
    templateId: "verification-mail",
    templateData: {
      username: name,
      verificationUrl,
    },
  });
}