// app/api/admin/mfa/check-verified/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ verified: false })
  }

  const cookieStore = await cookies()
  const mfaVerified = cookieStore.get("mfa_verified")?.value

  // Cookie value session user id se match karo
  const verified = mfaVerified === session.user.id

  return NextResponse.json({ verified })
}