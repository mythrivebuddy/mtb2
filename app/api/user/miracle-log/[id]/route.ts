import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import {prisma} from "@/lib/prisma";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();
    
    if (!content) {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    const log = await prisma.miracleLog.findUnique({
      where: { id: params.id }
    });

    if (!log || log.userId !== session.user.id) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const updatedLog = await prisma.miracleLog.update({
      where: { id: params.id },
      data: { content }
    });

    return NextResponse.json(updatedLog);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update log" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const log = await prisma.miracleLog.findUnique({
      where: { id: params.id }
    });

    if (!log || log.userId !== session.user.id) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    await prisma.miracleLog.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Log deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete log" },
      { status: 500 }
    );
  }
} 