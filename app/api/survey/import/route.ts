import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type QuestionInput = {
  text: string;
  options: string;
  categoryName: string;
  isMultiSelect: string | boolean;
};


export async function POST(request: Request) {
  const body = await request.json();
  const { categories, questions } = body;

  if (!categories || !questions) {
    return NextResponse.json({ error: 'Missing categories or questions data.' }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Step 1: Bulk insert categories, skipping any that already exist.
      await tx.category.createMany({
        data: categories.map((c: { name: string }) => ({ name: c.name })),
        skipDuplicates: true,
      });

      // Step 2: Get all categories from the DB to map names to IDs.
      const allDbCategories = await tx.category.findMany();
      const categoryMap = new Map(allDbCategories.map(c => [c.name, c.id]));

      // Step 3: Prepare the questions data with the correct categoryId.
      const questionsToCreate = questions.map((q: QuestionInput) => {
        const categoryId = categoryMap.get(q.categoryName);
        if (!categoryId) {
          throw new Error(`Category "${q.categoryName}" not found for question "${q.text}".`);
        }
        return {
          name: q.text,
          options: q.options.split(';').map((s: string) => s.trim()), // Split options string into an array
          categoryId: categoryId,
          isMultiSelect: q.isMultiSelect === 'TRUE' || q.isMultiSelect === true, // Handle boolean from excel
        };
      });

      // Step 4: Bulk insert the questions.
      await tx.question.createMany({
        data: questionsToCreate,
      });
    });

    return NextResponse.json({ message: 'Data imported successfully' }, { status: 201 });

 } catch (error: unknown) {
  console.error("Import failed:", error);
  const message = error instanceof Error ? error.message : 'Failed to import data.';
  return NextResponse.json({ error: message }, { status: 500 });
}
}