import { prisma } from "@/lib/prisma";
import { QuestionForm } from "./(components)/QuestionForm";
import { QuestionList } from "./(components)/QuestionList";

// Fetches data on the server before rendering the page
export default async function QuestionsPage() {
  const questions = await prisma.question.findMany({
    include: { category: true }, // Also fetch the related category for each question
    orderBy: { createdAt: "desc" },
  });
  
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
