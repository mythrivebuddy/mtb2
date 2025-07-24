import { prisma } from "@/lib/prisma";
import { QuestionForm } from "./(components)/QuestionForm";
import { QuestionList } from "./(components)/QuestionList";
import { Prisma } from "@prisma/client";                                                        
 

type QuestionWithRelations = Prisma.QuestionGetPayload<{
  include: { category: true }
}>;

export default async function QuestionsPage() {
  const questionsRaw: QuestionWithRelations[] = await prisma.question.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

console.log("Fetched questions:");

  const questions = questionsRaw.map(q => ({
    ...q,
    questionText: q.name, // Use 'name' as the question text
    options: Array.isArray(q.options) ? q.options : [],
  }));

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Manage Questions</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column for the form */}
        <div className="lg:col-span-1">
          <QuestionForm categories={categories} />
        </div>
        {/* Column for the list */}
        <div className="lg:col-span-2">
          <QuestionList questions={questions} />
        </div>
      </div>
    </div>
  );
}