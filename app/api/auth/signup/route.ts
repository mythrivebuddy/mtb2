import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/schema/zodSchema";
import { ActivityType } from "@prisma/client";
import { assignJp } from "@/lib/utils/jp";
import { sign } from "jsonwebtoken";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    const { email, password, name } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = sign({ email }, process.env.JWT_SECRET!, {
      expiresIn: "24h",
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_URL}/verify-email?token=${verificationToken}`;

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

    const emailVerificationPayload = {
      sender: { email: senderEmail },
      to: [{ email, name }],
      subject: "Verify Your Email",
      htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #151E46;">Welcome to MyThriveBuddy!</h2>
          <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #151E46; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours.
          </p>
        </div>
      `,
    };

    // Send the email
    await axios.post(brevoApiUrl, emailVerificationPayload, { headers });


    // In your signup route (after user is created)



    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "USER",
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ),
      },
      include: { plan: true },
    });



    //  * assign JP as signup reward
    assignJp(user, ActivityType.SIGNUP);

    return NextResponse.json({
      message:
        "User created successfully. Please check your email to verify your account.",
        userId: user.id // 👈 return this to the frontend

    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
