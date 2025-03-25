import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function checkRole(
  role: Role,
  msg: string = "You are not authorized for this action"
) {
  const session = await getServerSession(authConfig);
  console.log(session);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== role) {
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
