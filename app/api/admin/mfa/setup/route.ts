import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { authenticator } from "otplib"
import QRCode from "qrcode"

// ─── POST /api/admin/mfa/setup ────────────────────────────────────────────────
// Generates a new TOTP secret and QR code for the admin to scan.
// Returns 400 if MFA is already enabled to prevent re-setup.

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if MFA is already configured for this admin
  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { mfaSecret: true, mfaEnabled: true },
  })

  // Prevent re-setup if MFA is already active
  if (user?.mfaEnabled && user?.mfaSecret) {
    return NextResponse.json(
      { error: "MFA already enabled" },
      { status: 400 }
    )
  }

  // Generate a new TOTP secret and persist it (mfaEnabled stays false until verified)
  const secret = authenticator.generateSecret()

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { mfaSecret: secret, mfaEnabled: false },
  })

  // Build the otpauth URI and convert it to a scannable QR code
  const otpauth = authenticator.keyuri(
    session.user.email ?? "admin",
    "MyThriveBuddy Admin",
    secret
  )
  const qrCodeUrl = await QRCode.toDataURL(otpauth)

  return NextResponse.json({ qrCodeUrl, secret })
}