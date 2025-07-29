'use client';

import { useState } from 'react';
import CategoryManager from './components/CategoryManager';
import QuestionManager from './components/QuestionManager';
import ExcelImportExport from './components/ExcelImportExport';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export type CategoryType = { id: string; name: string; imageUrl: string };
export type QuestionType = {
  id: string;
  text: string;
  options: string[];
  isMulti: boolean;
  categoryId: string;
};

export default function SurveyManagementPage() {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [questions, setQuestions] = useState<QuestionType[]>([]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Survey Management</h1>

      <Tabs defaultValue="category" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="category">Category</TabsTrigger>
          <TabsTrigger value="question">Question</TabsTrigger>
          <TabsTrigger value="excel">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="category">
          <CategoryManager
            categories={categories}
            setCategories={setCategories}
            questions={questions}
          />
        </TabsContent>

        <TabsContent value="question">
          <QuestionManager
            categories={categories}
            questions={questions}
            setQuestions={setQuestions}
          />
        </TabsContent>

        <TabsContent value="excel">
          <ExcelImportExport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
