import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { text, categoryId } = await request.json();
  if (!text || !categoryId) {
    return NextResponse.json({ error: 'Question text and categoryId are required' }, { status: 400 });
  }
  try {
    const question = await prisma.question.create({
      data: { name: text, categoryId }
    });
    return NextResponse.json(question);
  } catch {
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
