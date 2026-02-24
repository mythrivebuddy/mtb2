import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserActivePlanPriority } from "@/lib/subscription";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ priority: 0 });
  }

  const priority = await getUserActivePlanPriority(session.user.id);

  return NextResponse.json({ priority });
}
