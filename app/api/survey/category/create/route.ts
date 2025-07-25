import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
  }
  try {
    const category = await prisma.category.create({
      data: { name }
    });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
