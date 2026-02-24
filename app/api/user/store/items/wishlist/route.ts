import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth.config";

export async function GET() {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        item: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json({ wishlist });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await req.json();

  const exists = await prisma.wishlist.findFirst({
    where: { userId: session.user.id, itemId },
  });

  if (exists) {
    return NextResponse.json(
      { message: "Already in wishlist" },
      { status: 400 }
    );
  }

  const wishlistItem = await prisma.wishlist.create({
    data: { userId: session.user.id, itemId },
  });

  return NextResponse.json({ wishlistItem });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await req.json();

  await prisma.wishlist.deleteMany({
    where: { userId: session.user.id, itemId },
  });

  return NextResponse.json({ message: "Removed from wishlist" });
}
