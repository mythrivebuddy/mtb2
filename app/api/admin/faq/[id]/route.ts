import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const faqId = params.id;

  try {
    await prisma.faq.delete({
      where: { id: faqId },
    });

    return NextResponse.json({ message: 'FAQ deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'FAQ not found or already deleted' }, { status: 404 });
  }
}
