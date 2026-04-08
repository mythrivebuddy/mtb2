import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateVerificationToken,
  sendVerificationEmail,
} from "@/lib/auth/emailVerification";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // ── Find user ─────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email },
    });

    //  Do NOT reveal whether user exists (security)
    if (!user) {
      return NextResponse.json({
        message: "If this email exists, a verification email has been sent.",
      });
    }

    // ── Already verified ──────────────────────────────────────
    if (user.isEmailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 },
      );
    }

    // ── Rate limiting (VERY IMPORTANT) ────────────────────────
    const now = new Date();
    const lastSent = user.emailVerificationLastSentAt;

    if (lastSent) {
      const diffInSeconds =
        (now.getTime() - new Date(lastSent).getTime()) / 1000;

      if (diffInSeconds < 60) {
        return NextResponse.json(
          { error: "Please wait before requesting another email." },
          { status: 429 },
        );
      }
    }

    // ── Generate new token ────────────────────────────────────
    const { token, expires } = generateVerificationToken(email);

    // ── Update user ───────────────────────────────────────────
    await prisma.user.update({
      where: { email },
      data: {
        emailVerificationToken: token,
        emailVerificationTokenExpires: expires,
        emailVerificationLastSentAt: now,
      },
    });

    // ── Send email ────────────────────────────────────────────
    await sendVerificationEmail(user.email, user.name, token);

    return NextResponse.json({
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 },
    );
  }
}
