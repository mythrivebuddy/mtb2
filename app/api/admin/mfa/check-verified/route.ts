import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { cookies } from "next/headers"

// ─── GET /api/admin/mfa/check-verified ───────────────────────────────────────
// Checks whether the current admin session has already completed MFA verification
// by comparing the `mfa_verified` cookie value against the session user ID.
// Returns { verified: false } for non-admin or unauthenticated requests.

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ verified: false })
  }

  const cookieStore = await cookies()
  const mfaVerified = cookieStore.get("mfa_verified")?.value

  // Cookie must match the session user ID to be considered verified
  const verified = mfaVerified === session.user.id

  return NextResponse.json({ verified })
}