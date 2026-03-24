import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { authenticator } from "otplib"
import QRCode from "qrcode"

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const secret = authenticator.generateSecret()

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      mfaSecret: secret,
      mfaEnabled: false
    }
  })

  const otpauth = authenticator.keyuri(
    session.user.email ?? "admin",
    "MyThriveBuddy Admin",
    secret
  )

  const qrCodeUrl = await QRCode.toDataURL(otpauth)

  return NextResponse.json({ qrCodeUrl })
}