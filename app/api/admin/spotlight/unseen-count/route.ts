// app/api/spotlight/unseen-count/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const count = await prisma.spotlight.count({
      where: { seenByAdmin: false, status: "APPLIED" }, 
    });

    return NextResponse.json({ count });
  } catch (err) {
    console.error("Unseen spotlight count error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
