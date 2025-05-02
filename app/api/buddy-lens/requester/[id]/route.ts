import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Attempting to delete request with ID:', id);

    // Verify Prisma client is initialized
    if (!prisma) {
      console.error('Prisma client is not initialized');
      throw new Error('Prisma client is not initialized');
    }

    // Validate ID format (optional, depending on your ID type)
    if (!id || typeof id !== 'string') {
      console.error('Invalid ID provided:', id);
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    // Delete the request from the database
    const deletedRequest = await prisma.buddyLensRequest.delete({
      where: { id },
    });

    console.log('Request deleted successfully:', deletedRequest);

    return NextResponse.json(
      { message: 'Request deleted successfully', data: deletedRequest },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Type guard for Prisma errors
    const isPrismaError = (err: unknown): err is Prisma.PrismaClientKnownRequestError =>
      err instanceof Prisma.PrismaClientKnownRequestError;

    // Log error details
    console.error('Error deleting request:', {
      message: isPrismaError(error) ? error.message : error instanceof Error ? error.message : 'Unknown error',
      code: isPrismaError(error) ? error.code : undefined,
      stack: isPrismaError(error) ? error.stack : error instanceof Error ? error.stack : undefined,
      // id: id,
    });

    // Handle Prisma-specific errors
    if (isPrismaError(error) && error.code === 'P2025') {
      // Record not found
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: isPrismaError(error) ? error.message : error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}