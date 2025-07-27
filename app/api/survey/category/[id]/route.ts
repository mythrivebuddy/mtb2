import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function DELETE(
  request: NextRequest,
  context : { params: { id: string } }
) {
  const id = context.params.id;

  if (!id) {
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
  }

  try {
    // Delete related questions first
    await prisma.question.deleteMany({
      where: { categoryId: id },
    });

    // Then delete the category
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Category and its questions deleted successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

// Type guard for Prisma not found error
function isPrismaNotFoundError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2025'
  );
}
