import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decode, TokenExpiredError, verify } from "jsonwebtoken";
import {
  generateVerificationToken,
  sendVerificationEmail,
} from "@/lib/auth/emailVerification";

const cooldownMinutes = 2;

export async function POST(req: Request) {
  let token: string | undefined;
  try {
    const body = await req.json();
    token = body.token;

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 },
      );
    }

    // Verify the token
    const decoded = verify(token, process.env.JWT_SECRET!) as {
      email: string;
      exp: number;
    };

    // Check if token is expired
    if (Date.now() >= decoded.exp * 1000) {
      return NextResponse.json(
        { error: "Verification link has expired" },
        { status: 400 },
      );
    }

    // Update user's email verification status
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isEmailVerified) {
      console.log("User already verified");
      return NextResponse.json(
        { success: true, type: "already_verified" },
        { status: 200 },
      );
    }

    // Then verify
    await prisma.user.update({
      where: { email: user.email },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      },
    });

    return NextResponse.json(
      { success: true, type: "verified" },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      const decoded = decode(token!) as { email: string };

      const user = await prisma.user.findUnique({
        where: { email: decoded.email },
      });

      if (user && !user.isEmailVerified) {
        // Cooldown check
        if (user.emailVerificationLastSentAt) {
          const lastSent = new Date(user.emailVerificationLastSentAt).getTime();
          const now = Date.now();
          const diffMinutes = (now - lastSent) / (1000 * 60);

          if (diffMinutes < cooldownMinutes) {
            return NextResponse.json(
              {
                success: false,
                code: "COOLDOWN_ACTIVE",
                remainingMinutes: Math.ceil(cooldownMinutes - diffMinutes),
              },
              { status: 429 },
            );
          }
        }
        const { token: newToken, expires } = generateVerificationToken(
          user.email,
        );

        await prisma.user.update({
          where: { email: user.email },
          data: {
            emailVerificationToken: newToken,
            emailVerificationTokenExpires: expires,
            emailVerificationLastSentAt: new Date(),
          },
        });

        await sendVerificationEmail(user.email, user.name, newToken);
        console.log("New verification email sent successfully");

        return NextResponse.json(
          { success: false, code: "TOKEN_EXPIRED" },
          { status: 400 },
        );
      }

      if (user && user.isEmailVerified) {
        console.log("User already verified");
        return NextResponse.json(
          { success: true, type: "already_verified" },
          { status: 200 },
        );
      }
    }
    return NextResponse.json(
      { success: false, code: "INVALID_TOKEN" },
      { status: 400 },
    );
  }
}
