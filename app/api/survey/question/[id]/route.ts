import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
  }

  try {
    // Use Prisma to delete the question with the matching ID
    await prisma.question.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Question deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    // This handles the error if the question to be deleted is not found
   if (
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2025"
  ) {
  return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }
    
    console.error("Failed to delete question:", error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}