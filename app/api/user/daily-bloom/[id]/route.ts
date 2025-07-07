import { NextRequest, NextResponse } from "next/server";
import { dailyBloomSchema } from "@/schema/zodSchema";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bloom = await prisma?.todo.findUnique({
      where: { id: params.id },
    });

    if (!bloom) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(bloom);
  } catch {
    return NextResponse.json({ error: "Failed to fetch entry" }, { status: 500 });
  }
} 


export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // 1. Find existing bloom
    const existing = await prisma?.todo.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // 3. Full form update
    const validated = dailyBloomSchema.parse(body);

    const updated = await prisma?.todo.update({
      where: { id: params.id },
      data: validated,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma?.todo.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
