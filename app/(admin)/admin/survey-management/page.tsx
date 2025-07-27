import { prisma } from "@/lib/prisma";
// Corrected the import path to be relative to the current folder
import { SurveyTabs } from "./(component)/SurveyTabs";

// This Server Component fetches all the data needed for the child components
export default async function SurveyManagementPage() {

  const data = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { questions: true }
  });

  const questions = await prisma.question.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Survey Management</h1>
      <p className="text-gray-600">
        Manage your survey categories and questions, or import them in bulk using an Excel file.
      </p>
      
      {/* The main client component that will handle the tabbed interface */}
      <SurveyTabs data={data} questions={questions} />
    </div>
  );
}
