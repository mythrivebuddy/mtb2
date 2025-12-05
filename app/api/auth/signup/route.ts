import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/schema/zodSchema";
import { ActivityType } from "@prisma/client";
import { assignJp } from "@/lib/utils/jp";
import { sign } from "jsonwebtoken";
import { sendEmailUsingTemplate } from "@/utils/sendEmail";
import axios from "axios";

// Added these new imports at the top
import { addOrUpdateBrevoContact } from "@/lib/brevo";
import { splitFullName } from "@/lib/utils/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { captchaToken, ...userInput  } = body;

    if (!captchaToken) {
      return NextResponse.json(
        { error: "Captcha token missing" },
        { status: 400 }
      );
    }

    const captchaVerifyURL = "https://www.google.com/recaptcha/api/siteverify";

    const captchaResponse = await fetch(captchaVerifyURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
    });

    const captchaData = await captchaResponse.json();

    if (!captchaData.success) {
      return NextResponse.json(
        { error: "Captcha verification failed" },
        { status: 400 }
      );
    }


    // Validate input
    
    const validation = signupSchema.safeParse(userInput);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    const { email, password, name } = userInput;

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

    const verificationToken = sign({ email }, process.env.JWT_SECRET!, {
      expiresIn: "24h",
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_URL}/verify-email?token=${verificationToken}`;

    await sendEmailUsingTemplate({
      toEmail: email,
      toName: name,
      templateId: "verification-mail",
      templateData: {
        username: name,
        verificationUrl,
      },
    });

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: process.env.ADMIN_EMAIL === email ? "ADMIN" : "USER",
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ),
      },
      omit: { password: true },
      include: { plan: true },
    });

    // * assign JP as signup reward
    assignJp(user, ActivityType.SIGNUP);

    // 2. Replace your old commented-out code with this block
    // ✅ Sync contact with Brevo

    const { firstName, lastName } = splitFullName(user.name);

    await addOrUpdateBrevoContact({
      email: user.email,
      firstName: firstName,
      lastName: lastName,
    });

    return NextResponse.json({
      message:
        "User created successfully. Please check your email to verify your account.",
      user: user,
      userId: user.id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    if (error instanceof axios.AxiosError) {
      console.error("Signup error:", error?.response); //! only meant for debugging in production
    }
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}