import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { authenticator } from "otplib"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { otp, isSetup } = await req.json()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaSecret: true, mfaEnabled: true },
  })

  if (!user?.mfaSecret) {
    return NextResponse.json({ error: "MFA not configured" }, { status: 400 })
  }

  // OTP verify
  const isValid = authenticator.verify({
    token: otp,
    secret: user.mfaSecret,
  })

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid OTP. Please try again." },
      { status: 400 }
    )
  }

  // Agar setup flow hai toh MFA enable karo
  if (isSetup) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { mfaEnabled: true },
    })
  }

  // MFA verified cookie set karo (30 minutes)
  const cookieStore = await cookies()

  cookieStore.set("mfa_verified", session.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 30,
    path: "/",
  })

  return NextResponse.json({ success: true })
}