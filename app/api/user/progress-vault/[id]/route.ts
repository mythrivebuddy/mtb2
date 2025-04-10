import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await checkRole("USER");
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();
    
    if (!content) {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    const log = await prisma.progressVault.findUnique({
      where: { id: params.id }
    });

    if (!log || log.userId !== session.user.id) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const updatedLog = await prisma.progressVault.update({
      where: { id: params.id },
      data: { content }
    });

    return NextResponse.json(updatedLog);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update log" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await checkRole("USER");
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const log = await prisma.progressVault.findUnique({
      where: { id: params.id }
    });

    if (!log || log.userId !== session.user.id) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    await prisma.progressVault.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Log deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete log" },
      { status: 500 }
    );
  }
} 