import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(questions);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
