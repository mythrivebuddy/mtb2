import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import axios from "axios";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if user registered with Google
    if (user.authMethod === "GOOGLE") {
      return NextResponse.json(
        {
          error:
            "This email is registered with Google. Please use Google Sign-in instead.",
        },
        { status: 400 }
      );
    }

    const resetToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    const resetUrl = `${process.env.NEXT_URL}/reset-password?token=${resetToken}`;

    // Prepare email configuration
    const senderEmail = process.env.CONTACT_SENDER_EMAIL;
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (!senderEmail || !brevoApiKey) {
      throw new Error("Missing necessary environment variables");
    }

    const brevoApiUrl = "https://api.brevo.com/v3/smtp/email";
    const headers = {
      "Content-Type": "application/json",
      "api-key": brevoApiKey,
    };

    const resetEmailPayload = {
      sender: { email: senderEmail },
      to: [{ email: user.email, name: user.name }],
      subject: "Password Reset Request",
      htmlContent: `
        <p><strong>Hello ${user.name},</strong></p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>- The Team</p>
      `,
    };

    // Send the email
    const res = await axios.post(brevoApiUrl, resetEmailPayload, { headers });
    console.log("Email sent successfully:", res.data); //?dev

    return NextResponse.json(
      { message: "Password reset link sent to your email" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
