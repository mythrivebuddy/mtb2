import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─── GET /api/mini-mastery-programs/creator-signature ────────────────────────
// Returns the current user's MiniMastery creator signature

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const sig = await prisma.miniMasteryCreatorSignature.findUnique({
    where:  { userId: session.user.id },
    select: { id: true, type: true, text: true, imageUrl: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ signature: sig ?? null });
}

// ─── PUT /api/mini-mastery-programs/creator-signature ────────────────────────
// Upserts the creator signature (one per user)
//
// Body:
//   { type: "TEXT",  text: "John Doe" }
//   { type: "IMAGE", imageUrl: "https://..." }
//   { type: "DRAWN", imageUrl: "https://..." }  ← drawn signature stored as image URL

const bodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("TEXT"),
    text: z.string().min(1).max(100),
  }),
  z.object({
    type:     z.literal("IMAGE"),
    imageUrl: z.string().url(),
  }),
  z.object({
    type:     z.literal("DRAWN"),
    imageUrl: z.string().url(),
  }),
]);

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const userId = session.user.id;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ message: "Invalid JSON." }, { status: 400 }); }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { type } = parsed.data;
  const text     = type === "TEXT"             ? parsed.data.text     : null;
  const imageUrl = type === "IMAGE" || type === "DRAWN" ? parsed.data.imageUrl : null;

  const sig = await prisma.miniMasteryCreatorSignature.upsert({
    where:  { userId },
    create: { userId, type, text, imageUrl },
    update: { type, text, imageUrl },
    select: { id: true, type: true, text: true, imageUrl: true, updatedAt: true },
  });

  return NextResponse.json({ message: "Signature saved.", signature: sig });
}

// ─── DELETE /api/mini-mastery-programs/creator-signature ─────────────────────

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const existing = await prisma.miniMasteryCreatorSignature.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "No signature found." }, { status: 404 });
  }

  await prisma.miniMasteryCreatorSignature.delete({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ message: "Signature deleted." });
}